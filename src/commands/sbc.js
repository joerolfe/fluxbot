const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "sbc",
  async execute(message, args) {
    const query = args.join(" ");
    const futbinUrl = query
      ? `https://www.futbin.com/sbc/challenges?search=${encodeURIComponent(query)}`
      : "https://www.futbin.com/sbc";
    const futwizUrl = query
      ? `https://www.futwiz.com/en/fc26/sbcs?search=${encodeURIComponent(query)}`
      : "https://www.futwiz.com/en/fc26/sbcs";

    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle(query ? `🧩 SBC: ${query}` : "🧩 SBC Solutions")
      .setDescription(`Find the cheapest solution for ${query ? `**${query}**` : "any SBC"}:`)
      .addFields(
        { name: "FUTBIN", value: `[View solutions](${futbinUrl})`, inline: true },
        { name: "FUTWIZ", value: `[View solutions](${futwizUrl})`, inline: true },
      )
      .setFooter({ text: "FluxFUT • Use !sbc [name] to search a specific SBC" });

    await message.reply({ embeds: [embed] });
  },
};
