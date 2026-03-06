const { EmbedBuilder } = require("discord.js");
const { searchPlayer } = require("../utils/futdb");

module.exports = {
  name: "price",
  async execute(message, args) {
    if (!args.length) return message.reply("Usage: `!price [player name]` — e.g. `!price Mbappe`");
    const query = args.join(" ");

    try {
      const p = await searchPlayer(query);

      // FUTBIN uses different field names - handle both possibilities
      const name     = p.Player     || p.name     || query;
      const rating   = p.Rating     || p.rating   || "?";
      const position = p.Position   || p.position || "?";
      const pac      = p.PAC        || p.pace;
      const sho      = p.SHO        || p.shooting;
      const pas      = p.PAS        || p.passing;
      const dri      = p.DRI        || p.dribbling;
      const def      = p.DEF        || p.defending;
      const phy      = p.PHY        || p.physicality;
      const psPrice  = p.ps_price   || p.pricePs4  || p.price?.ps4;
      const xbPrice  = p.xbox_price || p.priceXbox || p.price?.xbox;
      const pcPrice  = p.pc_price   || p.pricePc   || p.price?.pc;

      const stat  = (v) => v != null ? `**${v}**` : "—";
      const price = (v) => v != null && v !== "0" ? `${Number(v).toLocaleString()} coins` : "N/A";

      const fields = [
        { name: "⚡ PAC", value: stat(pac), inline: true },
        { name: "🎯 SHO", value: stat(sho), inline: true },
        { name: "🎁 PAS", value: stat(pas), inline: true },
        { name: "🕹️ DRI", value: stat(dri), inline: true },
        { name: "🛡️ DEF", value: stat(def), inline: true },
        { name: "💪 PHY", value: stat(phy), inline: true },
        { name: "🎮 PS",   value: price(psPrice), inline: true },
        { name: "🎮 Xbox", value: price(xbPrice), inline: true },
        { name: "💻 PC",   value: price(pcPrice), inline: true },
      ];

      const embed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle(`${rating} ${name} — ${position}`)
        .addFields(fields)
        .setFooter({ text: "Data from FUTBIN • FluxFUT" })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (e) {
      await message.reply(`❌ ${e.message || "Something went wrong. Check the player name and try again."}`);
    }
  },
};
