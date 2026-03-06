const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete a number of messages from this channel")
    .addIntegerOption(opt =>
      opt.setName("amount")
        .setDescription("Number of messages to delete (1-100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(process.env.ROLE_MOD) && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return interaction.reply({ content: "❌ No permission.", flags: 64 });

    const amount = interaction.options.getInteger("amount");
    await interaction.channel.bulkDelete(amount, true);
    await interaction.reply({ content: `🗑️ Deleted **${amount}** messages.`, flags: 64 });
  },
};
