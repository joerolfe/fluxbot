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
    console.log("[FUTWIZ] Candidates:", JSON.stringify(candidates.slice(0, 5).map(c => ({ href: c.href, imgSrc: c.imgSrc }))));

    if (!candidates.length) return null;

    // Extract card type from card image URL — e.g. .../cards/toty/22083.png → "toty"
    function cardTypeFromSrc(src) {
      const m = src.match(/\/cards\/([^/?#]+)/i);
      return m ? m[1].toLowerCase().replace(/-/g, " ") : "";
    }

    // Extract numeric ID from href for sorting
    function hrefId(href) {
      const m = href.match(/\/(\d+)(?:[/?#]|$)/);
      return m ? parseInt(m[1], 10) : Infinity;
    }

    let target = candidates[0];
    if (version) {
      const v = version.toLowerCase();
      const isGold = v === "gold" || v === "rare gold";

      // Try matching from image src or href
      const versionMatch = candidates.find(c => {
        const ct = cardTypeFromSrc(c.imgSrc);
        return ct.includes(v) || c.href.toLowerCase().includes(v) || c.imgAlt.toLowerCase().includes(v);
      });

      if (versionMatch) {
        target = versionMatch;
        console.log("[FUTWIZ] Version matched:", target.href);
      } else if (isGold) {
        // Base gold card = lowest numeric ID (original card, added first)
        const sorted = [...candidates].sort((a, b) => hrefId(a.href) - hrefId(b.href));
        target = sorted[0];
        console.log("[FUTWIZ] Gold: picked lowest-ID candidate:", target.href);
      } else {
        console.log("[FUTWIZ] No version match found, using first result");
      }
    }

    // Extract rating, position, and stats from search result card text — always reliable
    // Format: "96\nST\nMbappe\nLM\nLW\nPAC\nSHO\nPAS\nDRI\nDEF\nPHY\n99\n96\n85\n96\n54\n81\n..."
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
    console.log("[FUTWIZ] From search text:", { ratingFromSearch, positionFromSearch, statsFromSearch });

    const fullUrl = target.href.startsWith("http") ? target.href : `${BASE}${target.href}`;
    await page.goto(fullUrl, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Try to get prices from Next.js page data
    const jsPrices = await page.evaluate(() => {
      try {
        const nd = window.__NEXT_DATA__?.props?.pageProps;
        const keys = nd ? Object.keys(nd) : [];
        console.log("[FUTWIZ-CLIENT] __NEXT_DATA__ pageProps keys:", keys.join(", "));
        const p = nd?.player || nd?.card || nd?.data;
        if (p) {
          console.log("[FUTWIZ-CLIENT] Player keys:", Object.keys(p).filter(k => /price|cost|coin/i.test(k)).join(", "));
          return { console: p.console_price ?? p.ps_price ?? p.consoleprice ?? null, pc: p.pc_price ?? p.pcprice ?? null };
        }
      } catch(e) {}
      return null;
    }).catch(() => null);
    console.log("[FUTWIZ] jsPrices:", jsPrices);

    const result = parsePlayer(await page.content(), fullUrl);
    if (!result.rating)   result.rating   = ratingFromSearch;
    if (!result.position) result.position = positionFromSearch;
    if (Object.keys(result.stats).length === 0) result.stats = statsFromSearch;
    return result;
  } finally {
    await page.close();
  }
}

function parsePlayer(html, url) {
  const $ = cheerio.load(html);

  // H1 contains "PlayerName FC 26 CARDTYPE" — e.g. "Kylian Mbappe FC 26 TOTY"
  const rawName = $("h1").first().text().trim() || $("[class*='card__name'], [class*='player-name']").first().text().trim();
  const name     = rawName.replace(/\s*fc\s*2\d.*$/i, "").trim() || rawName;
  const cardType = (rawName.match(/fc\s*2\d\s+(.+)$/i) || [])[1]?.trim() || "";

  const rating   = $("[class*='card__rating'], [class*='card-rating']").first().text().trim();
  const position = $("[class*='card__position'], [class*='card-position']").first().text().trim();
  // Club/nation: text node inside the filter links e.g. /fc26/players?teams[]=243
  const club   = $("a[href*='teams[]=']").first().clone().children().remove().end().text().trim();
  const nation = $("a[href*='nations[]=']").first().clone().children().remove().end().text().trim();

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

  console.log("[FUTWIZ] Parsed:", { name, cardType, rating, position, club, nation });
  // Log JS price data to understand structure for gold cards
  const scripts = $("script").map((_, el) => $(el).html() || "").get().join("\n");
  const jsIdx = scripts.search(/console.*?price|price.*?console|'console'|"console"/i);
  console.log("[FUTWIZ] JS price snippet:", jsIdx >= 0 ? scripts.substring(Math.max(0, jsIdx - 50), jsIdx + 300) : "NOT FOUND");

  const fmtPrice = (val) => (!val || val === "0") ? "N/A" : val + " coins";
  const pricePS  = fmtPrice(consoleMatch?.[1]);
  const priceXB  = fmtPrice(consoleMatch?.[1]);
  const pricePCn = fmtPrice(pcMatch?.[1]);

  return {
    name, rating, position, club, nation, cardType,
    stats,
    prices: { ps: pricePS, xbox: priceXB, pc: pricePCn },
    url,
  };
}

module.exports = { searchPlayer };
