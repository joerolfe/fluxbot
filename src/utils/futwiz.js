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

    const nameMatches = cards.filter(c => c.href.toLowerCase().includes(normalized));
    const candidates = nameMatches.length > 0 ? nameMatches : cards;
    console.log("[FUTWIZ] Candidates:", JSON.stringify(candidates.slice(0, 5)));

    if (!candidates.length) return null;

    // Version filter: first try to match from search result card data (no extra page loads needed)
    let target = candidates[0];
    if (version) {
      const v = version.toLowerCase();
      const versionMatch = candidates.find(c => {
        const fields = [c.href, c.text, c.title, c.ariaLabel, c.parentText, c.imgAlt];
        return fields.some(f => f.toLowerCase().includes(v));
      });
      if (versionMatch) {
        target = versionMatch;
        console.log("[FUTWIZ] Version matched from search results:", target.href);
      } else {
        // Fall back: visit each candidate page until cardType matches
        console.log("[FUTWIZ] No version match in search results, visiting pages...");
        const isGold = ["gold", "rare gold", "common gold"].some(g => v.includes(g));
        let firstResult = null;
        for (const card of candidates) {
          const fullUrl = card.href.startsWith("http") ? card.href : `${BASE}${card.href}`;
          await page.goto(fullUrl, { waitUntil: "networkidle2", timeout: 30000 });
          await new Promise(r => setTimeout(r, 2000));
          const result = parsePlayer(await page.content(), fullUrl);
          if (!firstResult) firstResult = result;
          const ct = (result.cardType || "").toLowerCase();
          if (ct.includes(v)) return result;
          // Base gold cards often have no special cardType label
          if (isGold && !result.cardType) return result;
        }
        return firstResult;
      }
    }

    const fullUrl = target.href.startsWith("http") ? target.href : `${BASE}${target.href}`;
    await page.goto(fullUrl, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    return parsePlayer(await page.content(), fullUrl);
  } finally {
    await page.close();
  }
}

function parsePlayer(html, url) {
  const $ = cheerio.load(html);

  // H1 contains "PlayerNamefc26 CARDTYPE" — e.g. "Kylian Mbappefc26 TOTY"
  const rawName = $("h1").first().text().trim() || $("[class*='card__name'], [class*='player-name']").first().text().trim();
  const name     = rawName.replace(/fc2\d.*$/i, "").trim() || rawName;
  const cardType = (rawName.match(/fc2\d\s+(.+)$/i) || [])[1]?.trim() || "";

  const rating   = $("[class*='card__rating'], [class*='card-rating']").first().text().trim();
  const position = $("[class*='card__position'], [class*='card-position']").first().text().trim();
  const club     = $("[class*='card__club'], .club-name, .player-club").first().text().trim();
  const nation   = $("[class*='card__nation'], .nation-name, .player-nation").first().text().trim();

  const stats = {};
  const statLabels = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
  $("[class*='card__attribute-value'], [class*='attribute-value']").each((i, el) => {
    if (i < 6) stats[statLabels[i]] = $(el).text().trim();
  });

  // Prices are in a sentence like:
  // "...xbox and playstation console market is 1,860,000 coins... and pc is 1,860,000 coins..."
  const bodyText = $("body").text();
  const consoleMatch = bodyText.match(/console market is ([\d,]+)\s*coins?/i);
  const pcMatch      = bodyText.match(/\bpc is ([\d,]+)\s*coins?/i);

  console.log("[FUTWIZ] Parsed:", { name, cardType, rating, position });

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
