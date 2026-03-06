const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Link your Whop Premium purchase to Discord")
    .addStringOption(opt =>
      opt.setName("email")
        .setDescription("Email used to purchase on Whop")
        .setRequired(true)),

  async execute(interaction) {
    await interaction.reply({ content: "⚠️ Verification is not fully configured yet. Please DM a mod for Premium access.", flags: 64 });
  },
};
