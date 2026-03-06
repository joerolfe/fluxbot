const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { searchPlayer } = require("../utils/futwiz");

function statBar(value) {
  const n = parseInt(value);
  if (isNaN(n)) return `${value}`;
  const filled = Math.round((n / 99) * 10);
  return `${"█".repeat(filled)}${"░".repeat(10 - filled)} ${n}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("compare")
    .setDescription("Compare two FC26 players side by side")
    .addStringOption(opt =>
      opt.setName("player1")
        .setDescription("First player — e.g. Mbappe")
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName("player2")
        .setDescription("Second player — e.g. Ronaldo")
        .setRequired(true)),

  async execute(interaction) {
    const p1Name = interaction.options.getString("player1");
    const p2Name = interaction.options.getString("player2");
    try {
      await interaction.deferReply();
    } catch {
      return;
    }

    try {
      const [p1, p2] = await Promise.all([searchPlayer(p1Name), searchPlayer(p2Name)]);

      if (!p1 || !p1.name) return interaction.editReply(`❌ Couldn't find **${p1Name}** on FUTWIZ.`);
      if (!p2 || !p2.name) return interaction.editReply(`❌ Couldn't find **${p2Name}** on FUTWIZ.`);

      const formatStats = (p) =>
        Object.entries(p.stats).map(([k, v]) => `**${k}:** ${statBar(v)}`).join("\n") || "Stats unavailable";

      const embed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle(`⚔️ ${p1.name} vs ${p2.name}`)
        .addFields(
          {
            name: `${p1.rating ?? ""} ${p1.name} (${p1.position ?? "?"})`,
            value: `${formatStats(p1)}\n\n💰 PS: ${p1.prices.ps}\n[FUTWIZ](${p1.url})`,
            inline: true,
          },
          {
            name: `${p2.rating ?? ""} ${p2.name} (${p2.position ?? "?"})`,
            value: `${formatStats(p2)}\n\n💰 PS: ${p2.prices.ps}\n[FUTWIZ](${p2.url})`,
            inline: true,
          },
        )
        .setFooter({ text: "Data from FUTWIZ • FluxFUT" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/compare]", err.message);
      await interaction.editReply(`⚠️ Failed to fetch player data — FUTWIZ may be down. Try again in a moment.`);
    }
  },
};
