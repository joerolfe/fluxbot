const { EmbedBuilder } = require("discord.js");
const { searchPlayer } = require("../utils/futdb");

function bar(value, max = 99) {
  if (value == null) return "N/A";
  const filled = Math.round((value / max) * 10);
  return `${"█".repeat(filled)}${"░".repeat(10 - filled)} ${value}`;
}

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

    try {
      const [p1, p2] = await Promise.all([searchPlayer(p1Name), searchPlayer(p2Name)]);

      const embed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle(`⚔️ ${p1.name ?? p1Name} vs ${p2.name ?? p2Name}`)
        .addFields(
          {
            name: `${p1.rating ?? "?"} ${p1.name ?? p1Name} (${p1.position ?? "?"})`,
            value: [
              `⚡ PAC: ${bar(p1.pace)}`,
              `🎯 SHO: ${bar(p1.shooting)}`,
              `🎁 PAS: ${bar(p1.passing)}`,
              `🕹️ DRI: ${bar(p1.dribbling)}`,
              `🛡️ DEF: ${bar(p1.defending)}`,
              `💪 PHY: ${bar(p1.physicality)}`,
            ].join("\n"),
            inline: true,
          },
          {
            name: `${p2.rating ?? "?"} ${p2.name ?? p2Name} (${p2.position ?? "?"})`,
            value: [
              `⚡ PAC: ${bar(p2.pace)}`,
              `🎯 SHO: ${bar(p2.shooting)}`,
              `🎁 PAS: ${bar(p2.passing)}`,
              `🕹️ DRI: ${bar(p2.dribbling)}`,
              `🛡️ DEF: ${bar(p2.defending)}`,
              `💪 PHY: ${bar(p2.physicality)}`,
            ].join("\n"),
            inline: true,
          },
        )
        .setFooter({ text: "Data from FUTDB • FluxFUT" })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (e) {
      await message.reply(`❌ ${e.message || "Couldn't find one or both players. Check spelling and try again."}`);
    }
  },
};
