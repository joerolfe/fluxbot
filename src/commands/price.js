const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { searchPlayer } = require("../utils/futwiz");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("price")
    .setDescription("Get a live player price from FUTWIZ")
    .addStringOption(opt =>
      opt.setName("player")
        .setDescription("Player name — e.g. Mbappe")
        .setRequired(true)),

  async execute(interaction) {
    const name = interaction.options.getString("player");
    try {
      await interaction.deferReply();
    } catch {
      return;
    }

    try {
      const p = await searchPlayer(name);

      if (!p || !p.name) {
        return interaction.editReply(`❌ Couldn't find **${name}** on FUTWIZ. Try a more specific name.`);
      }

      const embed = new EmbedBuilder()
        .setColor(0x22C55E)
        .setTitle(`💰 Price Check — ${p.rating ? p.rating + " " : ""}${p.name}`)
        .setDescription(
          p.cardType
            ? `**${p.cardType}** | ${p.position || ""} | ${p.club || ""}`
            : `${p.position || ""} | ${p.club || ""}`
        )
        .addFields(
          { name: "🎮 PS Price",    value: p.prices.ps,   inline: true },
          { name: "🎮 Xbox Price",  value: p.prices.xbox, inline: true },
          { name: "💻 PC Price",    value: p.prices.pc,   inline: true },
          { name: "🔗 Full Listing", value: `[View on FUTWIZ](${p.url})`, inline: false },
        )
        .setFooter({ text: "Live data from FUTWIZ • Buy smart 📈" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/price]", err.message);
      const fallbackUrl = `https://www.futwiz.com/en/fc26/players?search=${encodeURIComponent(name)}`;
      await interaction.editReply(`⚠️ Live fetch failed — [Search FUTWIZ for ${name}](${fallbackUrl})`);
    }
  },
};
