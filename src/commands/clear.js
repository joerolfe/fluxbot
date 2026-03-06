const { PermissionFlagsBits } = require("discord.js");
module.exports = {
  name: "clear",
  async execute(message, args) {
    if (!message.member.roles.cache.has(process.env.ROLE_MOD) && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply("❌ No permission.");
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) return message.reply("Usage: `!clear [1-100]`");
    await message.channel.bulkDelete(amount + 1, true);
    const m = await message.channel.send(`🗑️ Deleted **${amount}** messages.`);
    setTimeout(() => m.delete().catch(() => {}), 4000);
  },
};