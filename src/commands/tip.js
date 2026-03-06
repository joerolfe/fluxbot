const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
module.exports = {
  name: "tip",
  async execute(message, args, client) {
    if (!message.member.roles.cache.has(process.env.ROLE_MOD) && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply("❌ No permission.");
    const text = args.join(" ");
    if (!text) return message.reply("Usage: `!tip [message]`");
    const ch = message.guild.channels.cache.get(process.env.CHANNEL_WEEKLY_TIPS);
    if (!ch) return message.reply("Weekly tips channel not set.");
    await ch.send({ embeds: [new EmbedBuilder().setColor(0x3B82F6).setTitle("💡 Tip of the Week").setDescription(text).setFooter({ text: "FluxFUT — new tip every Monday" }).setTimestamp()] });
    await message.reply("✅ Tip posted.");
  },
};