const { PermissionFlagsBits } = require("discord.js");
module.exports = {
  name: "kick",
  async execute(message, args) {
    if (!message.member.roles.cache.has(process.env.ROLE_MOD) && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply("❌ No permission.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `!kick @user [reason]`");
    const reason = args.slice(1).join(" ") || "No reason given";
    await target.send(`You were kicked from FluxFUT. Reason: **${reason}**`).catch(() => {});
    await target.kick(reason);
    await message.channel.send(`✅ <@${target.id}> kicked. Reason: **${reason}**`);
  },
};