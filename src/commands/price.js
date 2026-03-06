const { EmbedBuilder } = require("discord.js");
const { searchPlayer } = require("../utils/futdb");

module.exports = {
  name: "price",
  async execute(message, args) {
    if (!args.length) return message.reply("Usage: `!price [player name]` — e.g. `!price Mbappe`");
    const query = args.join(" ");

    try {
      const p = await searchPlayer(query);

      const stat = (v) => v != null ? `**${v}**` : "N/A";
      const price = (v) => v != null ? `${Number(v).toLocaleString()} coins` : "N/A";

      const embed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle(`${p.rating ?? "?"} ${p.name ?? query} — ${p.position ?? "?"}`)
        .addFields(
          { name: "⚡ PAC", value: stat(p.pace), inline: true },
          { name: "🎯 SHO", value: stat(p.shooting), inline: true },
          { name: "🎁 PAS", value: stat(p.passing), inline: true },
          { name: "🕹️ DRI", value: stat(p.dribbling), inline: true },
          { name: "🛡️ DEF", value: stat(p.defending), inline: true },
          { name: "💪 PHY", value: stat(p.physicality), inline: true },
          { name: "💰 PS Price", value: price(p.pricePs4 ?? p.ps4Price ?? p.price?.ps4), inline: true },
          { name: "💰 Xbox Price", value: price(p.priceXbox ?? p.xboxPrice ?? p.price?.xbox), inline: true },
          { name: "💰 PC Price", value: price(p.pricePc ?? p.pcPrice ?? p.price?.pc), inline: true },
        )
        .setFooter({ text: "Data from FUTDB • FluxFUT" })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (e) {
      await message.reply(`❌ ${e.message || "Something went wrong. Check the player name and try again."}`);
    }
  },
};
