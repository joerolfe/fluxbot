const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all FluxFUT bot commands"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle("🔵 FluxFUT Bot — Commands")
      .addFields(
        { name: "📊 Info & Meta", value: "`/meta` `/tactics` `/squad`", inline: false },
        { name: "💰 Players & SBCs", value: "`/player` — full card stats & prices from FUTWIZ\n`/price` — live player price from FUTWIZ\n`/compare` — compare two players side by side\n`/sbc` — find SBC solutions on FUTBIN", inline: false },
        { name: "⭐ Premium", value: "`/premium` — view FluxFUT Premium perks & pricing\n`/verify` — link your Whop purchase to Discord", inline: false },
        { name: "⚙️ Mod Only", value: "`/warn` `/kick` `/ban` `/clear` `/announce` `/alert` `/tip`", inline: false },
        { name: "💡 Tips", value: "`/tactics` has a formation dropdown — choose 4-2-3-1, 4-3-3 or 5-2-3", inline: false },
      )
      .setFooter({ text: "FluxFUT — Control the Meta" });

    await interaction.reply({ embeds: [embed] });
  },
};
