const { EmbedBuilder } = require("discord.js");
const { searchPlayer } = require("../utils/futdb");

module.exports = {
  name: "price",
  async execute(message, args) {
    if (!args.length) return message.reply("Usage: `!price [player name]` — e.g. `!price Mbappe`");
    const query = args.join(" ");

    try {
      const p = await searchPlayer(query);

      const name = p.commonName || p.name || query;
      const stat = (v) => v != null ? `**${v}**` : "—";

      const embed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle(`${p.rating ?? "?"} ${name} — ${p.position ?? "?"}`)
        .addFields(
          { name: "⚡ PAC", value: stat(p.pace),        inline: true },
          { name: "🎯 SHO", value: stat(p.shooting),    inline: true },
          { name: "🎁 PAS", value: stat(p.passing),     inline: true },
          { name: "🕹️ DRI", value: stat(p.dribbling),   inline: true },
          { name: "🛡️ DEF", value: stat(p.defending),   inline: true },
          { name: "💪 PHY", value: stat(p.physicality), inline: true },
          { name: "🌟 Play Styles", value: p.playStylesPlus?.length ? p.playStylesPlus.join(", ") : p.playStyles?.join(", ") || "—", inline: false },
          { name: "⚽ Skill / Weak Foot", value: `${p.skillMoves ?? "?"}★ Skills  •  ${p.weakFoot ?? "?"}★ Weak Foot`, inline: false },
        )
        .setFooter({ text: "Data from FUTDatabase • FluxFUT" })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (e) {
      await message.reply(`❌ ${e.message || "Something went wrong. Check the player name and try again."}`);
    }
  },
};
