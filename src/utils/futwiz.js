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

  // H1 contains "PlayerName FC 26 CARDTYPE" — e.g. "Kylian Mbappe FC 26 TOTY"
  const rawName = $("h1").first().text().trim() || $("[class*='card__name'], [class*='player-name']").first().text().trim();
  const name     = rawName.replace(/\s*fc\s*2\d.*$/i, "").trim() || rawName;
  const cardType = (rawName.match(/fc\s*2\d\s+(.+)$/i) || [])[1]?.trim() || "";

  const rating   = $("[class*='card__rating'], [class*='card-rating']").first().text().trim();
  const position = $("[class*='card__position'], [class*='card-position']").first().text().trim();
  // Club/nation are linked pages — extract from anchor hrefs
  const club   = $("a[href*='/fc26/club/'], a[href*='/clubs/']").first().text().trim() ||
                 $("a[href*='/club/']").first().text().trim();
  const nation = $("a[href*='/fc26/nation/'], a[href*='/nations/']").first().text().trim() ||
                 $("a[href*='/nation/']").first().text().trim();
  console.log("[FUTWIZ] Club link text:", $("a[href*='/club']").map((_, el) => $(el).text().trim()).get().slice(0, 5));
  console.log("[FUTWIZ] Nation link text:", $("a[href*='/nation']").map((_, el) => $(el).text().trim()).get().slice(0, 5));

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
