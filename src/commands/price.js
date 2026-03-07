const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { searchPlayer } = require("../utils/futwiz");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("price")
    .setDescription("Get a live player price from FUTWIZ")
    .addStringOption(opt =>
      opt.setName("player")
        .setDescription("Player name — e.g. Mbappe")
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName("version")
        .setDescription("Card version — e.g. TOTY, IF, RTTK, Gold")),

  async execute(interaction) {
    const name    = interaction.options.getString("player");
    const version = interaction.options.getString("version");
    try {
      await interaction.deferReply();
    } catch {
      return;
    }

    try {
      const p = await searchPlayer(name, version);

      if (!p || !p.name) {
        return interaction.editReply(`❌ Couldn't find **${name}** on FUTWIZ. Try a more specific name.`);
      }

      const title = [p.rating, p.cardType, p.name].filter(Boolean).join(" ");
      const statsLine = Object.entries(p.stats)
        .map(([k, v]) => `**${k}** ${v}`)
        .join("  |  ") || "Stats unavailable";

      const embed = new EmbedBuilder()
        .setColor(0x22C55E)
        .setTitle(`💰 ${title}`)
        .addFields(
          { name: "📊 Stats", value: statsLine, inline: false },
          { name: "🎮 PS",   value: p.prices.ps,   inline: true },
          { name: "🎮 Xbox", value: p.prices.xbox, inline: true },
          { name: "💻 PC",   value: p.prices.pc,   inline: true },
          { name: "🔗 FUTWIZ", value: `[View card](${p.url})`, inline: false },
        )
        .setFooter({ text: "Live data from FUTWIZ" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/price]", err.message);
      const fallbackUrl = `https://www.futwiz.com/en/fc26/players?search=${encodeURIComponent(name)}`;
      await interaction.editReply(`⚠️ Live fetch failed — [Search FUTWIZ for ${name}](${fallbackUrl})`);
    }
  },
};
