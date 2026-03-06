const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("meta")
    .setDescription("Current patch meta report"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle("📊 Meta Report — Current Patch")
      .addFields(
        { name: "🏆 S-Tier Formations", value: "**4-2-3-1 Narrow** — best all-round balance\n**4-3-3 Attack** — highest scoring potential\n**5-2-3** — best for manual defending", inline: false },
        { name: "⚡ S-Tier Mechanics", value: "**Press After Possession Loss** — high press is dominant\n**Get In Behind** for forwards\n**Stay Back** for both CDMs", inline: false },
        { name: "💡 Patch Tip", value: "Manual defending outperforms legacy this patch. Switch to manual in settings.", inline: false },
        { name: "📍 Full Breakdown", value: "See **#meta-updates** for the full card tier list", inline: false },
      )
      .setFooter({ text: "Updated every patch • FluxFUT" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
