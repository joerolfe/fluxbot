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
    await new Promise(r => setTimeout(r, 4000));

    const firstLink = await page.evaluate(() => {
      const a = document.querySelector('a[href*="/fc26/player/"], a[href*="/player/"]');
      return a ? a.getAttribute("href") : null;
    });

    console.log("[FUTWIZ] First player link:", firstLink);
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

  const name     = $("h1").first().text().trim() || $(".player-name").first().text().trim();
  const rating   = $(".rating, .card-rating").first().text().trim();
  const position = $(".position, .card-position").first().text().trim();
  const club     = $(".club-name, .player-club").first().text().trim();
  const nation   = $(".nation-name, .player-nation").first().text().trim();
  const cardType = $(".card-type, .version").first().text().trim();

  const stats = {};
  const statLabels = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
  $(".stat-val, .attr-val, .player-stats span").each((i, el) => {
    if (i < 6) stats[statLabels[i]] = $(el).text().trim();
  });

  let pricePS  = "N/A";
  let priceXB  = "N/A";
  let pricePCn = "N/A";

  $("*").each((_, el) => {
    const text = $(el).text();
    if (/ps(5|4)?\s*price/i.test(text)) {
      const match = text.match(/([\d,]+)\s*coins?/i);
      if (match) pricePS = match[1] + " coins";
    }
    if (/xbox/i.test(text)) {
      const match = text.match(/([\d,]+)\s*coins?/i);
      if (match) priceXB = match[1] + " coins";
    }
    if (/pc\s*price/i.test(text)) {
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
