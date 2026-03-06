const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: "help",
  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle("🔵 FluxFUT Bot — Commands")
      .addFields(
        { name: "📊 Info", value: "`!meta` `!tactics` `!squad` `!discord` `!price [player]`", inline: false },
        { name: "⚙️ Mod Only", value: "`!warn @user` `!kick @user` `!ban @user` `!clear [amount]` `!announce [text]` `!alert [text]` `!tip [text]`", inline: false },
        { name: "🔒 Premium", value: "`!verify [email]` — links your Whop purchase to Discord", inline: false },
      )
      .setFooter({ text: "FluxFUT — Control the Meta" });
    await message.reply({ embeds: [embed] });
  },
};