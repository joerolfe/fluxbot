const { EmbedBuilder } = require("discord.js");

async function fetchPlayer(name) {
  const res = await fetch(`https://www.futbin.com/search?year=26&term=${encodeURIComponent(name)}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) throw new Error(`No results for "${name}"`);
  return data[0];
}

function formatPlayer(p, fallbackName) {
  const name = p.Player || p.name || fallbackName;
  const rating = p.Rating || p.rating || "?";
  const position = p.Position || p.position || "?";
  const ps = p.ps_price ? `${Number(p.ps_price).toLocaleString()} coins` : "N/A";
  const xbox = p.xbox_price ? `${Number(p.xbox_price).toLocaleString()} coins` : "N/A";
  return `**${rating} ${name}** (${position})\n🎮 PS: ${ps}\n🎮 Xbox: ${xbox}`;
}

module.exports = {
  name: "compare",
  async execute(message, args) {
    if (args.length < 2) return message.reply("Usage: `!compare [player1] vs [player2]` — e.g. `!compare Mbappe vs Ronaldo`");

    const vsIndex = args.findIndex(a => a.toLowerCase() === "vs");
    let p1Name, p2Name;
    if (vsIndex > 0) {
      p1Name = args.slice(0, vsIndex).join(" ");
      p2Name = args.slice(vsIndex + 1).join(" ");
    } else {
      const mid = Math.ceil(args.length / 2);
      p1Name = args.slice(0, mid).join(" ");
      p2Name = args.slice(mid).join(" ");
    }

    if (!p1Name || !p2Name) return message.reply("Usage: `!compare [player1] vs [player2]`");

    try {
      const [p1, p2] = await Promise.all([fetchPlayer(p1Name), fetchPlayer(p2Name)]);

      const embed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle("⚔️ Player Comparison")
        .addFields(
          { name: p1Name, value: formatPlayer(p1, p1Name), inline: true },
          { name: "​", value: "**VS**", inline: true },
          { name: p2Name, value: formatPlayer(p2, p2Name), inline: true },
        )
        .setFooter({ text: "Data from FUTBIN • FluxFUT" })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (e) {
      await message.reply(`❌ ${e.message || "Couldn't find one or both players. Check spelling and try again."}\nUsage: \`!compare Mbappe vs Ronaldo\``);
    }
  },
};
