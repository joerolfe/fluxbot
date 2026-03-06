async function searchPlayer(name) {
  const res = await fetch(`https://www.futbin.com/search?year=26&term=${encodeURIComponent(name)}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Referer": "https://www.futbin.com/",
      "Accept": "application/json, text/javascript, */*",
    },
  });
  if (!res.ok) throw new Error(`FUTBIN returned ${res.status}`);

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("FUTBIN didn't return valid data");
  }

  const items = Array.isArray(data) ? data : data.data || data.items || data.players;
  if (!items || !items.length) throw new Error(`No results found for "${name}"`);
  return items[0];
}

module.exports = { searchPlayer };
