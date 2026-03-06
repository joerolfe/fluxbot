const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: "meta",
  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle("📊 Meta Report — Current Patch")
      .addFields(
        { name: "🏆 Best Formations", value: "**4-2-3-1 Narrow** — best balance\n**4-3-3 Attack** — highest scoring\n**5-2-3** — best for manual defenders", inline: false },
        { name: "💡 Patch Tip", value: "High press is strong this patch — use 'Press After Possession Loss'", inline: false },
        { name: "📍 Full Breakdown", value: "See #meta-updates for full card list", inline: false },
      )
      .setFooter({ text: "Updated every patch • FluxFUT" })
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  },
};