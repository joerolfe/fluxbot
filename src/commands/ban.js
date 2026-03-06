const { PermissionFlagsBits } = require("discord.js");
module.exports = {
  name: "ban",
  async execute(message, args) {
    if (!message.member.roles.cache.has(process.env.ROLE_MOD) && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply("❌ No permission.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `!ban @user [reason]`");
    const reason = args.slice(1).join(" ") || "No reason given";
    await target.send(`You were banned from FluxFUT. Reason: **${reason}**`).catch(() => {});
    await target.ban({ reason, deleteMessageSeconds: 86400 });
    await message.channel.send(`✅ <@${target.id}> banned. Reason: **${reason}**`);
  },
};