const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { searchPlayer, VERSIONS } = require("../utils/futwiz");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("player")
    .setDescription("Look up a live FC26 player from FUTWIZ")
    .addStringOption(opt =>
      opt.setName("name")
        .setDescription("Full player name — e.g. Kylian Mbappe")
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName("version")
        .setDescription("Card version — e.g. TOTY, IF, Gold")
        .setRequired(true)
        .setAutocomplete(true)),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const filtered = VERSIONS.filter(v => v.toLowerCase().includes(focused));
    await interaction.respond(filtered.slice(0, 25).map(v => ({ name: v, value: v }))).catch(() => {});
  },

  async execute(interaction) {
    const name    = interaction.options.getString("name");
    const version = interaction.options.getString("version");
    try {
      await interaction.deferReply();
    } catch {
      return;
    }

    try {
      const p = await searchPlayer(name, version);

      if (!p || !p.name) {
        return interaction.editReply(`❌ Couldn't find **${name}** on FUTWIZ. Try the full name.`);
      }

      const statsLine = Object.entries(p.stats)
        .map(([k, v]) => `**${k}** ${v}`)
        .join("  |  ") || "Stats unavailable";

      const title = [p.rating, p.cardType, p.name].filter(Boolean).join(" ");
      const details = [
        p.position ? `**Position:** ${p.position}` : "",
        p.club     ? `**Club:** ${p.club}`           : "",
        p.nation   ? `**Nation:** ${p.nation}`        : "",
      ].filter(Boolean).join("  |  ");

      const embed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle(title)
        .setDescription(details || null)
        .addFields(
          { name: "📊 Stats", value: statsLine, inline: false },
          {
            name: "💰 Prices",
            value: `🎮 PS: ${p.prices.ps}\n🎮 Xbox: ${p.prices.xbox}\n💻 PC: ${p.prices.pc}`,
            inline: false,
          },
          { name: "🔗 FUTWIZ", value: `[View card](${p.url})`, inline: false },
        )
        .setFooter({ text: p.versionFound ? "Data from FUTWIZ • Prices update live" : `⚠️ ${version} version not found — showing closest match` })
        .setTimestamp();

      if (p.cardImage) embed.setThumbnail(p.cardImage);

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/player]", err.message);
      await interaction.editReply(`⚠️ Failed to fetch **${name}** — FUTWIZ may be down. Try again in a moment.`);
    }
  },
};
