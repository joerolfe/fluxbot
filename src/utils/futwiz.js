const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const cheerio = require("cheerio");
const { execSync } = require("child_process");
const fs = require("fs");

puppeteer.use(StealthPlugin());

const BASE = "https://www.futwiz.com";
let _browser = null;

function getChromiumPath() {
  const candidates = [process.env.CHROMIUM_PATH];

  for (const name of ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable"]) {
    try {
      const p = execSync(`which ${name}`, { stdio: ["pipe", "pipe", "pipe"] }).toString().trim();
      if (p) candidates.push(p);
    } catch {}
  }

  candidates.push("/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome");

  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return "chromium";
}

async function getBrowser() {
  if (!_browser || !_browser.isConnected()) {
    _browser = await puppeteer.launch({
      headless: true,
      executablePath: getChromiumPath(),
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-zygote"],
    });
  }
  return _browser;
}

async function searchPlayer(name, version = null) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-GB,en;q=0.9" });

    await page.goto(`${BASE}/en/fc26/players?search=${encodeURIComponent(name)}`, { waitUntil: "networkidle2", timeout: 30000 });

    const searchInput = await page.$('input[type="search"], input[type="text"][placeholder], input[name="search"], input[name="q"], input[name="s"]');
    if (searchInput) {
      await searchInput.click({ clickCount: 3 });
      await searchInput.type(name, { delay: 80 });
    }

    await new Promise(r => setTimeout(r, 5000));

    const normalized = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const cards = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href*='/player/']")).map(a => ({
        href: a.getAttribute("href"),
        text: a.innerText.trim(),
        title: a.getAttribute("title") || "",
        ariaLabel: a.getAttribute("aria-label") || "",
        parentText: a.parentElement?.innerText?.trim() || "",
        imgAlt: a.querySelector("img")?.getAttribute("alt") || "",
      }))
    );
    console.log("[FUTWIZ] Cards sample:", JSON.stringify(cards.filter(c => c.href.toLowerCase().includes(normalized)).slice(0, 3)));

    const nameMatches = cards.filter(c => c.href.toLowerCase().includes(normalized));
    let match;
    if (version) {
      const v = version.toLowerCase();
      const allText = c => [c.text, c.title, c.ariaLabel, c.parentText, c.imgAlt].join(" ").toLowerCase();
      match = nameMatches.find(c => allText(c).includes(v)) || nameMatches[0];
    } else {
      match = nameMatches[0];
    }

    const firstLink = match?.href || cards[0]?.href;
    if (!firstLink) return null;

    const fullUrl = firstLink.startsWith("http") ? firstLink : `${BASE}${firstLink}`;
    await page.goto(fullUrl, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const html = await page.content();
    return parsePlayer(html, fullUrl);
  } finally {
    await page.close();
  }
}

function parsePlayer(html, url) {
  const $ = cheerio.load(html);

  const rawName  = $("h1").first().text().trim() || $(".player-name, .fc25-card__name").first().text().trim();
  const name     = rawName.replace(/fc2\d.*$/i, "").trim() || rawName;
  const cardType = (rawName.match(/fc2\d\s+(.+)$/i) || [])[1]?.trim() || $(".fc25-card__type, .card-type, .version").first().text().trim();
  const rating   = $(".fc25-card__rating").first().text().trim();
  const position = $(".fc25-card__position, .card-position, .position").first().text().trim();
  const club     = $(".club-name, .player-club, .fc25-card__club").first().text().trim();
  const nation   = $(".nation-name, .player-nation, .fc25-card__nation").first().text().trim();

  const stats = {};
  const statLabels = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
  $(".fc25-card__attribute-value").each((i, el) => {
    if (i < 6) stats[statLabels[i]] = $(el).text().trim();
  });

  // Prices are in a sentence like:
  // "...xbox and playstation console market is 1,860,000 coins... and pc is 1,860,000 coins..."
  const bodyText = $("body").text();
  const consoleMatch = bodyText.match(/console market is ([\d,]+)\s*coins?/i);
  const pcMatch      = bodyText.match(/\bpc is ([\d,]+)\s*coins?/i);

  const pricePS  = consoleMatch ? consoleMatch[1] + " coins" : "N/A";
  const priceXB  = consoleMatch ? consoleMatch[1] + " coins" : "N/A";
  const pricePCn = pcMatch      ? pcMatch[1] + " coins"      : "N/A";

  return {
    name, rating, position, club, nation, cardType,
    stats,
    prices: { ps: pricePS, xbox: priceXB, pc: pricePCn },
    url,
  };
}

module.exports = { searchPlayer };
