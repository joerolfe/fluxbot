module.exports = {
  name: "verify",
  async execute(message, args, client) {
    const email = args[0];
    if (!email || !email.includes("@")) return message.reply("Usage: `!verify your@email.com`");
    await message.delete().catch(() => {});
    await message.author.send("⚠️ Verification is not fully configured yet. Please DM a mod for Premium access.").catch(() => {});
  },
};