const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const warnCounts = new Map();
module.exports = {
  name: "warn",
  async execute(message, args, client) {
    if (!message.member.roles.cache.has(process.env.ROLE_MOD) && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply("❌ No permission.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `!warn @user [reason]`");
    const reason = args.slice(1).join(" ") || "No reason given";
    const count = (warnCounts.get(target.id) || 0) + 1;
    warnCounts.set(target.id, count);
    await target.send(`⚠️ Warned in FluxFUT. Reason: **${reason}** (${count}/3)`).catch(() => {});
    await message.channel.send(`⚠️ <@${target.id}> warned — ${reason} (${count}/3)`);
  },
};