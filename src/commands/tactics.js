const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const formations = {
  "4231": new EmbedBuilder()
    .setColor(0x3B82F6)
    .setTitle("🎯 4-2-3-1 Narrow — S-Tier META")
    .addFields(
      { name: "⚙️ Team Settings", value: "**Defensive Style:** Balanced\n**Width:** 45 | **Depth:** 70\n**Build Up:** Balanced\n**Chance Creation:** Forward Runs\n**Players In Box:** 6", inline: false },
      { name: "📋 Player Instructions", value: "CDMs: Stay Back / Cover Centre\nCAM: Get In Behind\nST: Get In Behind", inline: false },
      { name: "⭐ Premium", value: "Full importable tactic files → **#custom-tactics-packs**", inline: false },
    )
    .setFooter({ text: "FluxFUT — Control the Meta" }),

  "433": new EmbedBuilder()
    .setColor(0x3B82F6)
    .setTitle("🎯 4-3-3 Attack — High Scoring")
    .addFields(
      { name: "⚙️ Team Settings", value: "**Defensive Style:** Press After Loss\n**Width:** 55 | **Depth:** 65\n**Build Up:** Long Ball\n**Chance Creation:** Forward Runs\n**Players In Box:** 7", inline: false },
      { name: "📋 Player Instructions", value: "CM (box-to-box): Join the Attack\nLW/RW: Cut Inside\nST: Stay Central", inline: false },
      { name: "⭐ Premium", value: "Full importable tactic files → **#custom-tactics-packs**", inline: false },
    )
    .setFooter({ text: "FluxFUT — Control the Meta" }),

  "523": new EmbedBuilder()
    .setColor(0x3B82F6)
    .setTitle("🎯 5-2-3 — Best Defensive Option")
    .addFields(
      { name: "⚙️ Team Settings", value: "**Defensive Style:** Balanced\n**Width:** 40 | **Depth:** 60\n**Build Up:** Counter\n**Chance Creation:** Direct Passing\n**Players In Box:** 5", inline: false },
      { name: "📋 Player Instructions", value: "Wing-Backs: Overlap\nCMs: Stay Back / Cover Centre\nSTs: Press High", inline: false },
      { name: "⭐ Premium", value: "Full importable tactic files → **#custom-tactics-packs**", inline: false },
    )
    .setFooter({ text: "FluxFUT — Control the Meta" }),
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tactics")
    .setDescription("Get meta tactics for a formation")
    .addStringOption(opt =>
      opt.setName("formation")
        .setDescription("Formation to view (default: 4231)")
        .addChoices(
          { name: "4-2-3-1 Narrow (S-Tier)", value: "4231" },
          { name: "4-3-3 Attack (High Scoring)", value: "433" },
          { name: "5-2-3 (Best Defensive)", value: "523" },
        )),

  async execute(interaction) {
    const key = interaction.options.getString("formation") || "4231";
    await interaction.reply({ embeds: [formations[key]] });
  },
};
