async function searchPlayer(name) {
  const res = await fetch(`https://api.futdatabase.com/api/players/search?name=${encodeURIComponent(name)}`, {
    headers: { "accept": "application/json" },
  });
  if (!res.ok) throw new Error(`API returned ${res.status}`);

  const json = await res.json();
  const items = json.items || json.data || json;
  if (!Array.isArray(items) || !items.length) throw new Error(`No results found for "${name}"`);
  return items[0];
}

module.exports = { searchPlayer };
