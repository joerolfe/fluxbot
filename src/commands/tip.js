const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tip")
    .setDescription("Post a tip to the weekly tips channel")
    .addStringOption(opt =>
      opt.setName("message")
        .setDescription("Tip text")
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(process.env.ROLE_MOD) && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return interaction.reply({ content: "❌ No permission.", flags: 64 });

    const text = interaction.options.getString("message");
    const ch = interaction.guild.channels.cache.get(process.env.CHANNEL_WEEKLY_TIPS);
    if (!ch) return interaction.reply({ content: "❌ Weekly tips channel not set.", flags: 64 });

    await ch.send({ embeds: [new EmbedBuilder().setColor(0x3B82F6).setTitle("💡 Tip of the Week").setDescription(text).setFooter({ text: "FluxFUT — new tip every Monday" }).setTimestamp()] });
    await interaction.reply({ content: "✅ Tip posted.", flags: 64 });
  },
};
