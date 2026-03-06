module.exports = {
  name: "price",
  async execute(message, args) {
    if (!args.length) return message.reply("Usage: `!price [player name]` — e.g. `!price Mbappe`");
    const player = args.join(" ");
    const url = `https://www.futbin.com/players?search=${encodeURIComponent(player)}`;
    await message.reply(`🔍 **${player}** prices on FUTBIN:\n👉 ${url}`);
  },
};