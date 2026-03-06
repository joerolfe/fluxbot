const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "compare",
  async execute(message, args) {
    if (args.length < 2) return message.reply("Usage: `!compare [player1] vs [player2]` — e.g. `!compare Mbappe vs Ronaldo`");

    const vsIndex = args.findIndex(a => a.toLowerCase() === "vs");
    let p1Name, p2Name;
    if (vsIndex > 0) {
      p1Name = args.slice(0, vsIndex).join(" ");
      p2Name = args.slice(vsIndex + 1).join(" ");
    } else {
      const mid = Math.ceil(args.length / 2);
      p1Name = args.slice(0, mid).join(" ");
      p2Name = args.slice(mid).join(" ");
    }

    if (!p1Name || !p2Name) return message.reply("Usage: `!compare [player1] vs [player2]`");

    const p1Url = `https://www.futbin.com/players?search=${encodeURIComponent(p1Name)}`;
    const p2Url = `https://www.futbin.com/players?search=${encodeURIComponent(p2Name)}`;

    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle(`⚔️ ${p1Name} vs ${p2Name}`)
      .setDescription("Click each player to compare stats and prices on FUTBIN:")
      .addFields(
        { name: p1Name, value: `[View on FUTBIN](${p1Url})`, inline: true },
        { name: p2Name, value: `[View on FUTBIN](${p2Url})`, inline: true },
      )
      .setFooter({ text: "FluxFUT • Open both links to compare" });

    await message.reply({ embeds: [embed] });
  },
};
