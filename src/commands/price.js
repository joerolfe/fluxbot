const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "price",
  async execute(message, args) {
    if (!args.length) return message.reply("Usage: `!price [player name]` — e.g. `!price Mbappe`");
    const player = args.join(" ");
    const url = `https://www.futbin.com/players?search=${encodeURIComponent(player)}`;

    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle(`🔍 ${player}`)
      .setDescription(`[Search on FUTBIN](${url})`)
      .setFooter({ text: "FluxFUT" });

    await message.reply({ embeds: [embed] });
  },
};
