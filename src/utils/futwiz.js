const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const cheerio = require("cheerio");
const { execSync } = require("child_process");
const fs = require("fs");

puppeteer.use(StealthPlugin());

const BASE = "https://www.futwiz.com";
let _browser = null;

// ── Cache ────────────────────────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}

function setCached(key, data) {
  cache.set(key, { data, time: Date.now() });
}

// ── Version aliases ───────────────────────────────────────────────────────────
const VERSION_ALIASES = {
  "inform":            "IF",
  "in form":           "IF",
  "team of the year":  "TOTY",
  "team of the season":"TOTS",
  "team of the week":  "TOTW",
  "road to the knockouts": "RTTK",
  "player of the month":   "POTM",
  "man of the match":      "MOTM",
  "rare gold":   "Gold",
  "gold rare":   "Gold",
  "common gold": "Gold",
};

function normalizeVersion(v) {
  if (!v) return null;
  return VERSION_ALIASES[v.toLowerCase()] || v;
}

// ── Common versions for autocomplete ─────────────────────────────────────────
const VERSIONS = [
  "Gold", "Silver", "Bronze", "IF", "TOTY", "TOTS", "TOTW", "RTTK",
  "Icon", "Hero", "POTM", "MOTM", "FUT Birthday", "Futties", "UCL",
  "FUT Captains", "Thunderstruck", "Winter Wildcards", "Future Stars",
];

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
  version = normalizeVersion(version);
  const cacheKey = `${name.toLowerCase()}:${(version || "").toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) { console.log("[FUTWIZ] Cache hit:", cacheKey); return cached; }

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

    await new Promise(r => setTimeout(r, 3000));

    const normalized = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const cards = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href*='/player/']")).map(a => {
        const img = a.querySelector("img");
        const imgSrc = (img && (img.getAttribute("src") || img.getAttribute("data-src") ||
          img.getAttribute("data-lazy") || img.getAttribute("data-original") || "")) || "";
        return {
          href: a.getAttribute("href"),
          text: a.innerText.trim(),
          imgAlt: img?.getAttribute("alt") || "",
          imgSrc,
        };
      })
    );

    const nameMatches = cards.filter(c => c.href.toLowerCase().includes(normalized));
    const candidates = nameMatches.length > 0 ? nameMatches : cards;

    if (!candidates.length) return null;

    function cardTypeFromSrc(src) {
      const m = src.match(/\/cards\/([^/?#]+)/i);
      return m ? m[1].toLowerCase().replace(/-/g, " ") : "";
    }

    function hrefId(href) {
      const m = href.match(/\/(\d+)(?:[/?#]|$)/);
      return m ? parseInt(m[1], 10) : Infinity;
    }

    let target = candidates[0];
    let versionFound = !version; // true if no version requested

    if (version) {
      const v = version.toLowerCase();
      const isGold = v === "gold";

      const versionMatch = candidates.find(c => {
        const ct = cardTypeFromSrc(c.imgSrc);
        return ct.includes(v) || c.href.toLowerCase().includes(v) || c.imgAlt.toLowerCase().includes(v);
      });

      if (versionMatch) {
        target = versionMatch;
        versionFound = true;
        console.log("[FUTWIZ] Version matched from search results:", target.href);
      } else if (isGold) {
        const sorted = [...candidates].sort((a, b) => hrefId(a.href) - hrefId(b.href));
        target = sorted[0];
        versionFound = true;
        console.log("[FUTWIZ] Gold: picked lowest-ID candidate:", target.href);
      } else {
        console.log("[FUTWIZ] Visiting pages to find version:", v);
        let found = null;
        for (const card of candidates.slice(0, 5)) {
          const candidateUrl = card.href.startsWith("http") ? card.href : `${BASE}${card.href}`;
          await page.goto(candidateUrl, { waitUntil: "networkidle2", timeout: 30000 });
          await new Promise(r => setTimeout(r, 1000));
          const h1 = await page.evaluate(() => document.querySelector("h1")?.innerText?.trim() || "");
          const ct = (h1.match(/fc\s*2\d\s+(.+)$/i) || [])[1]?.trim().toLowerCase() || "";
          if (ct.includes(v)) { found = card; versionFound = true; break; }
        }
        target = found || candidates[0];
        if (!found) console.log("[FUTWIZ] No version match, using first result");
      }
    }

    // Extract rating, position, and stats from search result card text
    const textParts = target.text.split("\n").map(s => s.trim()).filter(Boolean);
    const ratingFromSearch   = /^\d+$/.test(textParts[0]) ? textParts[0] : "";
    const positionFromSearch = /^[A-Z]{1,3}$/.test(textParts[1]) ? textParts[1] : "";
    const statLabels = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
    const statsFromSearch = {};
    const pacIdx = textParts.indexOf("PAC");
    if (pacIdx >= 0) {
      const afterLabels = textParts.slice(pacIdx + statLabels.length);
      statLabels.forEach((label, i) => {
        if (afterLabels[i] && /^\d+$/.test(afterLabels[i])) statsFromSearch[label] = afterLabels[i];
      });
    }

    const fullUrl = target.href.startsWith("http") ? target.href : `${BASE}${target.href}`;
    await page.goto(fullUrl, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Extract prices from the JS chart data in window scope
    const jsPrices = await page.evaluate(() => {
      try {
        for (const key of Object.keys(window)) {
          const val = window[key];
          if (val && typeof val === "object" && !Array.isArray(val) &&
              Array.isArray(val.console) && Array.isArray(val.pc)) {
            const latest = arr => arr.length ? arr[arr.length - 1] : null;
            const cl = latest(val.console);
            const pl = latest(val.pc);
            return {
              console: Array.isArray(cl) ? cl[1] : cl,
              pc: Array.isArray(pl) ? pl[1] : pl,
            };
          }
        }
      } catch(e) {}
      return null;
    }).catch(() => null);

    const result = parsePlayer(await page.content(), fullUrl);
    if (!result.rating)   result.rating   = ratingFromSearch;
    if (!result.position) result.position = positionFromSearch;
    if (Object.keys(result.stats).length === 0) result.stats = statsFromSearch;
    if (jsPrices) {
      const fmt = v => (!v || v === 0) ? "N/A" : Number(v).toLocaleString("en-GB") + " coins";
      result.prices.ps   = fmt(jsPrices.console);
      result.prices.xbox = fmt(jsPrices.console);
      result.prices.pc   = fmt(jsPrices.pc);
    }
    result.versionFound = versionFound;

    setCached(cacheKey, result);
    return result;
  } finally {
    await page.close();
  }
}

function parsePlayer(html, url) {
  const $ = cheerio.load(html);

  const rawName  = $("h1").first().text().trim() || $("[class*='card__name'], [class*='player-name']").first().text().trim();
  const name     = rawName.replace(/\s*fc\s*2\d.*$/i, "").trim() || rawName;
  const cardType = (rawName.match(/fc\s*2\d\s+(.+)$/i) || [])[1]?.trim() || "";

  const rating   = $("[class*='card__rating'], [class*='card-rating']").first().text().trim();
  const position = $("[class*='card__position'], [class*='card-position']").first().text().trim();
  const club     = $("a[href*='teams[]=']").first().clone().children().remove().end().text().trim();
  const nation   = $("a[href*='nations[]=']").first().clone().children().remove().end().text().trim();

  // Card image from og:image meta tag
  const cardImage = $("meta[property='og:image']").attr("content") || "";

  const stats = {};
  const statLabels = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
  $("[class*='card__attribute-value'], [class*='attribute-value']").each((i, el) => {
    if (i < 6) stats[statLabels[i]] = $(el).text().trim();
  });

  const bodyText = $("body").text();
  const consoleMatch = bodyText.match(/console market is ([\d,]+)\s*coins?/i);
  const pcMatch      = bodyText.match(/\bpc is ([\d,]+)\s*coins?/i);

  console.log("[FUTWIZ] Parsed:", { name, cardType, rating, position, club, nation });

  const fmtPrice = (val) => (!val || val === "0") ? "N/A" : val + " coins";
  const pricePS  = fmtPrice(consoleMatch?.[1]);
  const priceXB  = fmtPrice(consoleMatch?.[1]);
  const pricePCn = fmtPrice(pcMatch?.[1]);

  return {
    name, rating, position, club, nation, cardType, cardImage,
    stats,
    prices: { ps: pricePS, xbox: priceXB, pc: pricePCn },
    url,
  };
}

module.exports = { searchPlayer, VERSIONS };
