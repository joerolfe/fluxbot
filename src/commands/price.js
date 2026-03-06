const { EmbedBuilder } = require("discord.js");

async function fetchPlayer(name) {
  const res = await fetch(`https://www.futbin.com/search?year=26&term=${encodeURIComponent(name)}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

module.exports = {
  name: "price",
  async execute(message, args) {
    if (!args.length) return message.reply("Usage: `!price [player name]` — e.g. `!price Mbappe`");
    const player = args.join(" ");
    const searchUrl = `https://www.futbin.com/players?search=${encodeURIComponent(player)}`;

    try {
      const data = await fetchPlayer(player);
      if (!Array.isArray(data) || !data.length) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(0x3B82F6)
          .setTitle(`🔍 ${player}`)
          .setDescription(`No results found. [Search manually on FUTBIN](${searchUrl})`)
          .setFooter({ text: "FluxFUT" })] });
      }

      const p = data[0];
      const name = p.Player || p.name || player;
      const rating = p.Rating || p.rating || "?";
      const position = p.Position || p.position || "?";
      const ps = p.ps_price ? `${Number(p.ps_price).toLocaleString()} coins` : "N/A";
      const xbox = p.xbox_price ? `${Number(p.xbox_price).toLocaleString()} coins` : "N/A";
      const pc = p.pc_price ? `${Number(p.pc_price).toLocaleString()} coins` : "N/A";

      const embed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle(`${rating} ${name} — ${position}`)
        .addFields(
          { name: "🎮 PS", value: ps, inline: true },
          { name: "🎮 Xbox", value: xbox, inline: true },
          { name: "💻 PC", value: pc, inline: true },
          { name: "🔗 Full Card", value: `[View on FUTBIN](${searchUrl})`, inline: false },
        )
        .setFooter({ text: "Prices from FUTBIN • FluxFUT" })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch {
      const embed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle(`🔍 ${player}`)
        .setDescription(`[Search on FUTBIN](${searchUrl})`)
        .setFooter({ text: "FluxFUT" });
      await message.reply({ embeds: [embed] });
    }
  },
};
