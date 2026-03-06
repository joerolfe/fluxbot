const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "sbc",
  async execute(message, args) {
    const query = args.join(" ");

    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle(query ? `🧩 SBC: ${query}` : "🧩 SBC Solutions")
      .setDescription(query ? `Find the cheapest solution for **${query}**:` : "Browse all active SBCs:")
      .addFields(
        { name: "FUTBIN", value: `[View SBCs](https://www.futbin.com/sbc)`, inline: true },
        { name: "FUTWIZ", value: `[View SBCs](https://www.futwiz.com/en/fc26/sbcs)`, inline: true },
      )
      .setFooter({ text: "FluxFUT • Search by name on either site" });

    await message.reply({ embeds: [embed] });
  },
};
