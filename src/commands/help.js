const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",
  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle("🔵 FluxFUT Bot — Commands")
      .addFields(
        { name: "📊 Info & Meta", value: "`!meta` `!tactics [formation]` `!squad` `!discord`", inline: false },
        { name: "💰 Players & SBCs", value: "`!price [player]` — live prices from FUTBIN\n`!compare [player1] vs [player2]` — compare two cards\n`!sbc [name]` — find SBC solutions", inline: false },
        { name: "⚙️ Mod Only", value: "`!warn @user [reason]` — auto-kicks at 3 warnings\n`!kick @user` `!ban @user` `!clear [amount]`\n`!announce [text]` `!alert [text]` `!tip [text]`", inline: false },
        { name: "🔒 Premium", value: "`!verify [email]` — links your Whop purchase to Discord", inline: false },
        { name: "💡 Tips", value: "`!tactics 433` or `!tactics 523` for other formations", inline: false },
      )
      .setFooter({ text: "FluxFUT — Control the Meta" });
    await message.reply({ embeds: [embed] });
  },
};
