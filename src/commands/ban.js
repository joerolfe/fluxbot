const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server")
    .addUserOption(opt =>
      opt.setName("user").setDescription("User to ban").setRequired(true))
    .addStringOption(opt =>
      opt.setName("reason").setDescription("Reason for ban"))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(process.env.ROLE_MOD) && !interaction.member.permissions.has(PermissionFlagsBits.BanMembers))
      return interaction.reply({ content: "❌ No permission.", flags: 64 });

    const target = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason given";

    await target.send(`You were banned from FluxFUT. Reason: **${reason}**`).catch(() => {});
    await target.ban({ reason, deleteMessageSeconds: 86400 });
    await interaction.reply({ content: `✅ <@${target.id}> banned. Reason: **${reason}**` });
  },
};
