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

  candidates.push(
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  );

  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      console.log(`[FUTWIZ] Chromium at: ${p}`);
      return p;
    }
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
    await page.goto(`${BASE}/en/fc26/players`, { waitUntil: "networkidle2", timeout: 30000 });

    // Find search input
    const searchInput = await page.$('input[type="search"], input[type="text"][placeholder], input[name="search"], input[name="q"], input[name="s"]');
    if (!searchInput) {
      const inputs = await page.evaluate(() =>
        Array.from(document.querySelectorAll("input")).map(i => ({ type: i.type, name: i.name, placeholder: i.placeholder, id: i.id, class: i.className }))
      );
      console.log("[FUTWIZ] Inputs found:", JSON.stringify(inputs));
      return null;
    }

    await searchInput.click({ clickCount: 3 });
    await searchInput.type(name, { delay: 80 });
    await new Promise(r => setTimeout(r, 3000));

    // Log everything visible after typing to find autocomplete structure
    const afterType = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href*='/player/']")).map(a => ({ href: a.getAttribute("href"), text: a.innerText.trim().slice(0, 50) })).slice(0, 10);
      const buttons = Array.from(document.querySelectorAll("button, [role='option'], [class*='suggest'], [class*='autocomplete'], [class*='result'], [class*='dropdown'] a")).map(el => ({ tag: el.tagName, text: el.innerText.trim().slice(0, 50), class: el.className.slice(0, 60) })).slice(0, 10);
      return { links, buttons };
    });
    // Match by name in href slug (e.g. "mbappe" in "/fc26/player/kylian-mbappe/22083")
    const normalized = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const match = afterType.links.find(l => l.href.toLowerCase().includes(normalized)) || afterType.links[0];
    const firstLink = match?.href;
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

  let pricePS  = "N/A";
  let priceXB  = "N/A";
  let pricePCn = "N/A";

  $("*").each((_, el) => {
    const text = $(el).text();
    if (/\b(ps[45]?|playstation)\b/i.test(text)) {
      const match = text.match(/([\d,]+)\s*coins?/i);
      if (match) pricePS = match[1] + " coins";
    }
    if (/\bxbox\b/i.test(text)) {
      const match = text.match(/([\d,]+)\s*coins?/i);
      if (match) priceXB = match[1] + " coins";
    }
    if (/\bpc\b/i.test(text)) {
      const match = text.match(/([\d,]+)\s*coins?/i);
      if (match) pricePCn = match[1] + " coins";
    }
  });

  const priceEls = $(".price, .player-price, [class*='price']");
  if (pricePS === "N/A" && priceEls.length) {
    pricePS = priceEls.first().text().replace(/\s+/g, " ").trim() || "N/A";
  }

  return {
    name, rating, position, club, nation, cardType,
    stats,
    prices: { ps: pricePS, xbox: priceXB, pc: pricePCn },
    url,
  };
}

module.exports = { searchPlayer };
