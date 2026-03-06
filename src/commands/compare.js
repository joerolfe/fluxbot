const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("compare")
    .setDescription("Compare two players on FUTBIN")
    .addStringOption(opt =>
      opt.setName("player1")
        .setDescription("First player — e.g. Mbappe")
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName("player2")
        .setDescription("Second player — e.g. Ronaldo")
        .setRequired(true)),

  async execute(interaction) {
    const p1 = interaction.options.getString("player1");
    const p2 = interaction.options.getString("player2");

    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle(`⚔️ ${p1} vs ${p2}`)
      .setDescription("Click each player to compare stats and prices on FUTBIN:")
      .addFields(
        { name: p1, value: `[View on FUTBIN](https://www.futbin.com/players?search=${encodeURIComponent(p1)})`, inline: true },
        { name: p2, value: `[View on FUTBIN](https://www.futbin.com/players?search=${encodeURIComponent(p2)})`, inline: true },
      )
      .setFooter({ text: "FluxFUT • Open both links to compare" });

    await interaction.reply({ embeds: [embed] });
  },
};
