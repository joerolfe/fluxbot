const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: "tactics",
  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle("🎯 4-2-3-1 Narrow — FluxFUT META")
      .addFields(
        { name: "⚙️ Settings", value: "**Defensive Style:** Balanced\n**Width:** 45 | **Depth:** 70\n**Build Up:** Balanced\n**Chance Creation:** Forward Runs\n**Players In Box:** 6", inline: false },
        { name: "📋 Player Instructions", value: "CDM: Stay Back / Cover Centre\nCAM: Get In Behind\nST: Get In Behind", inline: false },
        { name: "⭐ Premium", value: "Full importable tactic files → #custom-tactics-packs", inline: false },
      )
      .setFooter({ text: "FluxFUT — Control the Meta" });
    await message.reply({ embeds: [embed] });
  },
};