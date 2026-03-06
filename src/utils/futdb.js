const BASE = "https://futdb.app/api";

async function searchPlayer(name) {
  const res = await fetch(`${BASE}/players/search`, {
    method: "POST",
    headers: {
      "X-AUTH-TOKEN": process.env.FUTDB_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`FUTDB API error: ${res.status}`);
  const json = await res.json();
  const items = json.data || json.items || json;
  if (!Array.isArray(items) || !items.length) throw new Error(`No results for "${name}"`);
  return items[0];
}

module.exports = { searchPlayer };
