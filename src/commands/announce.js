const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
module.exports = {
  name: "announce",
  async execute(message, args, client) {
    if (!message.member.roles.cache.has(process.env.ROLE_MOD) && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply("❌ No permission.");
    const text = args.join(" ");
    if (!text) return message.reply("Usage: `!announce [message]`");
    const ch = message.guild.channels.cache.get(process.env.CHANNEL_ANNOUNCEMENTS);
    if (!ch) return message.reply("Announcements channel not set.");
    await ch.send({ content: "@everyone", embeds: [new EmbedBuilder().setColor(0x3B82F6).setTitle("📣 Announcement").setDescription(text).setTimestamp()] });
    await message.reply("✅ Posted.");
  },
};