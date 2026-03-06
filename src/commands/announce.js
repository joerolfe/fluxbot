const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Post an announcement to the announcements channel")
    .addStringOption(opt =>
      opt.setName("message")
        .setDescription("Announcement text")
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(process.env.ROLE_MOD) && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return interaction.reply({ content: "❌ No permission.", flags: 64 });

    const text = interaction.options.getString("message");
    const ch = interaction.guild.channels.cache.get(process.env.CHANNEL_ANNOUNCEMENTS);
    if (!ch) return interaction.reply({ content: "❌ Announcements channel not set.", flags: 64 });

    await ch.send({ content: "@everyone", embeds: [new EmbedBuilder().setColor(0x3B82F6).setTitle("📣 Announcement").setDescription(text).setTimestamp()] });
    await interaction.reply({ content: "✅ Posted.", flags: 64 });
  },
};
