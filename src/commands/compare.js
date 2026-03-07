const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { searchPlayer, VERSIONS } = require("../utils/futwiz");

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
        .setDescription("Full player name — e.g. Kylian Mbappe")
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName("player2")
        .setDescription("Full player name — e.g. Cristiano Ronaldo")
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName("version1")
        .setDescription("Card version for player 1 — e.g. TOTY, Gold")
        .setAutocomplete(true))
    .addStringOption(opt =>
      opt.setName("version2")
        .setDescription("Card version for player 2 — e.g. TOTY, Gold")
        .setAutocomplete(true)),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const filtered = VERSIONS.filter(v => v.toLowerCase().includes(focused));
    await interaction.respond(filtered.slice(0, 25).map(v => ({ name: v, value: v }))).catch(() => {});
  },

  async execute(interaction) {
    const p1Name  = interaction.options.getString("player1");
    const p2Name  = interaction.options.getString("player2");
    const version1 = interaction.options.getString("version1");
    const version2 = interaction.options.getString("version2");
    try {
      await interaction.deferReply();
    } catch {
      return;
    }

    try {
      const [p1, p2] = await Promise.all([searchPlayer(p1Name, version1), searchPlayer(p2Name, version2)]);

      if (!p1 || !p1.name) return interaction.editReply(`❌ Couldn't find **${p1Name}** on FUTWIZ.`);
      if (!p2 || !p2.name) return interaction.editReply(`❌ Couldn't find **${p2Name}** on FUTWIZ.`);

      const cardLabel = (p) => [p.rating, p.cardType, p.name].filter(Boolean).join(" ");
      const formatStats = (p) =>
        Object.entries(p.stats).map(([k, v]) => `**${k}:** ${statBar(v)}`).join("\n") || "Stats unavailable";
      const formatPrices = (p) =>
        `🎮 PS: ${p.prices.ps}\n🎮 Xbox: ${p.prices.xbox}\n💻 PC: ${p.prices.pc}`;

      const embed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle(`⚔️ ${p1.name} vs ${p2.name}`)
        .addFields(
          {
            name: cardLabel(p1),
            value: `${formatStats(p1)}\n\n${formatPrices(p1)}\n[FUTWIZ](${p1.url})`,
            inline: true,
          },
          {
            name: cardLabel(p2),
            value: `${formatStats(p2)}\n\n${formatPrices(p2)}\n[FUTWIZ](${p2.url})`,
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
