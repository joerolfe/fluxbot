const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const warnCounts = new Map();

module.exports = {
  name: "warn",
  async execute(message, args) {
    if (!message.member.roles.cache.has(process.env.ROLE_MOD) && !message.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return message.reply("❌ No permission.");

    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `!warn @user [reason]`");

    const reason = args.slice(1).join(" ") || "No reason given";
    const count = (warnCounts.get(target.id) || 0) + 1;
    warnCounts.set(target.id, count);

    if (count >= 3) {
      await target.send(`⚠️ You have been **auto-kicked** from FluxFUT after 3 warnings. Final reason: **${reason}**`).catch(() => {});
      await target.kick(`Auto-kicked: 3 warnings reached. Last reason: ${reason}`).catch(() => {});
      warnCounts.delete(target.id);
      return message.channel.send(`🔨 <@${target.id}> was **auto-kicked** after reaching 3 warnings.`);
    }

    await target.send(`⚠️ You have been warned in **FluxFUT**.\nReason: **${reason}**\nWarning **${count}/3** — 3 warnings results in a kick.`).catch(() => {});
    await message.channel.send(`⚠️ <@${target.id}> warned — ${reason} (${count}/3)`);
  },
};
