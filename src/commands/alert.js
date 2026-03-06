const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("alert")
    .setDescription("Post a live trading alert to premium members")
    .addStringOption(opt =>
      opt.setName("message")
        .setDescription("Alert text")
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(process.env.ROLE_MOD) && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return interaction.reply({ content: "❌ No permission.", flags: 64 });

    const text = interaction.options.getString("message");
    const ch = interaction.guild.channels.cache.get(process.env.CHANNEL_LIVE_ALERTS);
    if (!ch) return interaction.reply({ content: "❌ Live alerts channel not set.", flags: 64 });

    await ch.send({ content: `<@&${process.env.ROLE_PREMIUM}>`, embeds: [new EmbedBuilder().setColor(0x22C55E).setTitle("📈 Live Trading Alert").setDescription(text).setFooter({ text: "FluxFUT Premium • Act fast" }).setTimestamp()] });
    await interaction.reply({ content: "✅ Alert posted.", flags: 64 });
  },
};
