const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: "squad",
  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle("🏗️ Recommended Squads")
      .setDescription("Full optimised squads → **#squad-builders** (Premium)")
      .addFields(
        { name: "💰 Under 50K — 4-3-3", value: "Focus on chemistry. Spend coins on your striker first.", inline: false },
        { name: "💰 Under 200K — 4-2-3-1", value: "One or two meta attackers, budget everywhere else.", inline: false },
        { name: "💰 200K+ — 4-3-3 / 4-2-3-1", value: "Build around your favourite attacker and fill in around them.", inline: false },
      )
      .setFooter({ text: "FluxFUT — updated every major content drop" });
    await message.reply({ embeds: [embed] });
  },
};