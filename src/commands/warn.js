const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const warnCounts = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user (auto-kicks at 3 warnings)")
    .addUserOption(opt =>
      opt.setName("user").setDescription("User to warn").setRequired(true))
    .addStringOption(opt =>
      opt.setName("reason").setDescription("Reason for warning"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(process.env.ROLE_MOD) && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return interaction.reply({ content: "❌ No permission.", flags: 64 });

    const target = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason given";
    const count = (warnCounts.get(target.id) || 0) + 1;
    warnCounts.set(target.id, count);

    if (count >= 3) {
      await target.send(`⚠️ You have been **auto-kicked** from FluxFUT after 3 warnings. Final reason: **${reason}**`).catch(() => {});
      await target.kick(`Auto-kicked: 3 warnings reached. Last reason: ${reason}`).catch(() => {});
      warnCounts.delete(target.id);
      return interaction.reply({ content: `🔨 <@${target.id}> was **auto-kicked** after reaching 3 warnings.` });
    }

    await target.send(`⚠️ You have been warned in **FluxFUT**.\nReason: **${reason}**\nWarning **${count}/3** — 3 warnings results in a kick.`).catch(() => {});
    await interaction.reply({ content: `⚠️ <@${target.id}> warned — ${reason} (${count}/3)` });
  },
};
