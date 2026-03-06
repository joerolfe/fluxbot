const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("premium")
    .setDescription("View FluxFUT Premium info and pricing"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle("⭐ FluxFUT Premium")
      .setDescription(
        "📈 **Live Trading Alerts**\n🎯 **Custom Tactics Packs**\n🏗️ **Squad Builders**\n🔍 **Patch Breakdowns**\n🎓 **Coaching Requests**\n🔒 **Private Strategy**\n\n**£9.99/month · 3-day free trial**\n\n👉 https://whop.com/fluxfut/fluxfut-premium/"
      )
      .setFooter({ text: "FluxFUT — Control the Meta" });

    await interaction.reply({ embeds: [embed] });
  },
};
