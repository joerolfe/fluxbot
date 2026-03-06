const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("price")
    .setDescription("Search for a player's price on FUTBIN")
    .addStringOption(opt =>
      opt.setName("player")
        .setDescription("Player name — e.g. Mbappe")
        .setRequired(true)),

  async execute(interaction) {
    const player = interaction.options.getString("player");
    const url = `https://www.futbin.com/players?search=${encodeURIComponent(player)}`;

    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle(`🔍 ${player}`)
      .setDescription(`[Search on FUTBIN](${url})`)
      .setFooter({ text: "FluxFUT" });

    await interaction.reply({ embeds: [embed] });
  },
};
