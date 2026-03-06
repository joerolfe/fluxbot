const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
module.exports = {
  name: "alert",
  async execute(message, args, client) {
    if (!message.member.roles.cache.has(process.env.ROLE_MOD) && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply("❌ No permission.");
    const text = args.join(" ");
    if (!text) return message.reply("Usage: `!alert [message]`");
    const ch = message.guild.channels.cache.get(process.env.CHANNEL_LIVE_ALERTS);
    if (!ch) return message.reply("Live alerts channel not set.");
    await ch.send({ content: `<@&${process.env.ROLE_PREMIUM}>`, embeds: [new EmbedBuilder().setColor(0x22C55E).setTitle("📈 Live Trading Alert").setDescription(text).setFooter({ text: "FluxFUT Premium • Act fast" }).setTimestamp()] });
    await message.reply("✅ Alert posted.");
  },
};