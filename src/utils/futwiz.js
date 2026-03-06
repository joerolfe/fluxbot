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

async function searchPlayer(name) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-GB,en;q=0.9" });

    // Navigate to search URL first so the SPA sets the search context
    await page.goto(`${BASE}/en/fc26/players?search=${encodeURIComponent(name)}`, { waitUntil: "networkidle2", timeout: 30000 });

    // Then find the search input and type to trigger the SPA filter
    const searchInput = await page.$('input[type="search"], input[type="text"][placeholder], input[name="search"], input[name="q"], input[name="s"]');
    if (searchInput) {
      await searchInput.click({ clickCount: 3 });
      await searchInput.type(name, { delay: 80 });
    }

    // Wait for filtered results to appear
    await new Promise(r => setTimeout(r, 5000));

    const normalized = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href*='/player/']")).map(a => a.getAttribute("href"))
    );

    const firstLink = links.find(h => h.toLowerCase().includes(normalized)) || links[0];
    if (!firstLink) return null;

    const fullUrl = firstLink.startsWith("http") ? firstLink : `${BASE}${firstLink}`;
    await page.goto(fullUrl, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const priceLines = await page.evaluate(() =>
      document.body.innerText.split("\n").map(l => l.trim()).filter(l => l && /ps|xbox|pc|coin/i.test(l)).slice(0, 20)
    );
    console.log("[FUTWIZ] Price lines:", JSON.stringify(priceLines));
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

  let pricePS  = "N/A";
  let priceXB  = "N/A";
  let pricePCn = "N/A";

  // Only check leaf nodes so we don't match parent elements containing all prices
  $("*").each((_, el) => {
    if ($(el).children().length > 0) return;
    const text = $(el).text().trim();
    if (!text) return;
    const num = text.match(/([\d,]+)\s*coins?/i);
    if (!num) return;
    const price = num[1] + " coins";
    const label = $(el).closest("*").parent().text().toLowerCase();
    if (/ps[45]?|playstation/i.test(label) && pricePS === "N/A") pricePS = price;
    if (/xbox/i.test(label) && priceXB === "N/A") priceXB = price;
    if (/\bpc\b/i.test(label) && pricePCn === "N/A") pricePCn = price;
  });

  return {
    name, rating, position, club, nation, cardType,
    stats,
    prices: { ps: pricePS, xbox: priceXB, pc: pricePCn },
    url,
  };
}

module.exports = { searchPlayer };
