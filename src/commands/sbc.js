const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "sbc",
  async execute(message, args) {
    const query = args.join(" ");

    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle(query ? `🧩 SBC: ${query}` : "🧩 SBC Solutions")
      .setDescription(query ? `Find the cheapest solution for **${query}** on FUTBIN:` : "Browse all active SBCs on FUTBIN:")
      .addFields(
        { name: "🔗 FUTBIN", value: `[View SBCs](https://www.futbin.com/home-tab/new-sbcs)`, inline: false },
      )
      .setFooter({ text: "FluxFUT • Search by name on FUTBIN" });

    await message.reply({ embeds: [embed] });
  },
};
