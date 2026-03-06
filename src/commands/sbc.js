const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sbc")
    .setDescription("Find SBC solutions on FUTBIN")
    .addStringOption(opt =>
      opt.setName("name")
        .setDescription("SBC name to search for (optional)")),

  async execute(interaction) {
    const query = interaction.options.getString("name");

    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle(query ? `🧩 SBC: ${query}` : "🧩 SBC Solutions")
      .setDescription(query ? `Find the cheapest solution for **${query}** on FUTBIN:` : "Browse all active SBCs on FUTBIN:")
      .addFields({ name: "🔗 FUTBIN", value: "[View SBCs](https://www.futbin.com/home-tab/new-sbcs)", inline: false })
      .setFooter({ text: "FluxFUT • Search by name on FUTBIN" });

    await interaction.reply({ embeds: [embed] });
  },
};
