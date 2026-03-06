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
        { name: "📊 Info & Meta", value: "`/meta` `/tactics` `/squad` `/discord`", inline: false },
        { name: "💰 Players & SBCs", value: "`/price` — FUTBIN player search\n`/compare` — compare two players on FUTBIN\n`/sbc` — find SBC solutions", inline: false },
        { name: "⚙️ Mod Only", value: "`/warn` `/kick` `/ban` `/clear` `/announce` `/alert` `/tip`", inline: false },
        { name: "🔒 Premium", value: "`/verify` — link your Whop purchase to Discord", inline: false },
        { name: "💡 Tips", value: "`/tactics formation:433` or `/tactics formation:523` for other formations", inline: false },
      )
      .setFooter({ text: "FluxFUT — Control the Meta" });

    await interaction.reply({ embeds: [embed] });
  },
};
