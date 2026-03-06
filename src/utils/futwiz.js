const axios   = require("axios");
const cheerio = require("cheerio");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept-Language": "en-GB,en;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  Referer: "https://www.futwiz.com/",
};

const BASE = "https://www.futwiz.com";

async function searchPlayer(name) {
  const url = `${BASE}/en/fc26/players?search=${encodeURIComponent(name)}`;
  const { data } = await axios.get(url, { headers: HEADERS, timeout: 8000 });
  const $ = cheerio.load(data);

  const firstLink = $("a[href*='/en/fc26/player/']").first().attr("href");
  if (!firstLink) return null;

  return getPlayerByUrl(`${BASE}${firstLink}`);
}

async function getPlayerByUrl(url) {
  const { data } = await axios.get(url, { headers: HEADERS, timeout: 8000 });
  const $ = cheerio.load(data);

  const name     = $("h1").first().text().trim() ||
                   $(".player-name").first().text().trim();
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
