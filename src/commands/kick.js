const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user from the server")
    .addUserOption(opt =>
      opt.setName("user").setDescription("User to kick").setRequired(true))
    .addStringOption(opt =>
      opt.setName("reason").setDescription("Reason for kick"))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(process.env.ROLE_MOD) && !interaction.member.permissions.has(PermissionFlagsBits.KickMembers))
      return interaction.reply({ content: "❌ No permission.", flags: 64 });

    const target = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason given";

    await target.send(`You were kicked from FluxFUT. Reason: **${reason}**`).catch(() => {});
    await target.kick(reason);
    await interaction.reply({ content: `✅ <@${target.id}> kicked. Reason: **${reason}**` });
  },
};
