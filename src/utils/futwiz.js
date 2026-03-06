const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const cheerio = require("cheerio");
const { execSync } = require("child_process");

puppeteer.use(StealthPlugin());

function getChromiumPath() {
  const fs = require("fs");
  const candidates = [
    process.env.CHROMIUM_PATH,
  ];

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
    "/run/current-system/sw/bin/chromium",
    "/nix/var/nix/profiles/default/bin/chromium",
  );

  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      console.log(`[FUTWIZ] Chromium found at: ${p}`);
      return p;
    }
  }

  console.log("[FUTWIZ] PATH:", process.env.PATH);
  console.log("[FUTWIZ] Chromium not found in any known path");
  return "chromium";
}

const BASE = "https://www.futwiz.com";
let _browser = null;

async function getBrowser() {
  if (!_browser || !_browser.isConnected()) {
    _browser = await puppeteer.launch({
      headless: true,
      executablePath: getChromiumPath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
      ],
    });
  }
  return _browser;
}

async function fetchHtml(url) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-GB,en;q=0.9" });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]"))
        .map(a => a.getAttribute("href"))
        .filter(h => h)
        .slice(0, 20)
    );
    console.log("[FUTWIZ] All links on page:", JSON.stringify(links));
    return await page.content();
  } finally {
    await page.close();
  }
}

async function searchPlayer(name) {
  const html = await fetchHtml(`${BASE}/en/fc26/players?search=${encodeURIComponent(name)}`);
  const $ = cheerio.load(html);

  const firstLink = $("a[href*='/en/fc26/player/']").first().attr("href");
  if (!firstLink) return null;

  return getPlayerByUrl(`${BASE}${firstLink}`);
}

async function getPlayerByUrl(url) {
  const html = await fetchHtml(url);
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
