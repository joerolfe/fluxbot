require("dotenv").config();
const { Client, GatewayIntentBits, Collection, Events, REST, Routes } = require("discord.js");
const fs   = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.commands = new Collection();
const commandDefs = [];

const cmdDir = path.join(__dirname, "commands");
for (const file of fs.readdirSync(cmdDir).filter(f => f.endsWith(".js"))) {
  try {
    const cmd = require(path.join(cmdDir, file));
    if (cmd?.data && cmd?.execute) {
      client.commands.set(cmd.data.name, cmd);
      commandDefs.push(cmd.data.toJSON());
      console.log(`✅ Loaded: ${cmd.data.name}`);
    }
  } catch (e) {
    console.error(`❌ Failed to load ${file}:`, e.message);
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  if (interaction.isAutocomplete()) {
    if (command.autocomplete) await command.autocomplete(interaction).catch(() => {});
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  try {
    await command.execute(interaction);
  } catch (e) {
    console.error(`Command error [${interaction.commandName}]:`, e.message);
    const msg = { content: "Something went wrong.", flags: 64 };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg).catch(() => {});
    } else {
      await interaction.reply(msg).catch(() => {});
    }
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const memberRole = member.guild.roles.cache.get(process.env.ROLE_MEMBER);
    if (memberRole) await member.roles.add(memberRole);
  } catch (e) {
    console.error("Auto role error:", e.message);
  }
  const welcomeChannel = member.guild.channels.cache.get(process.env.CHANNEL_WELCOME);
  if (welcomeChannel) {
    welcomeChannel.send(`👋 Welcome <@${member.id}> — you're member **#${member.guild.memberCount}**! Check #rules then jump into #general-chat. 🔵`).catch(() => {});
  }
  member.send(`👋 Welcome to FluxFUT!\n\nCheck out #rules, jump into #general-chat, and see #meta-updates for the current patch.\n\nWant Premium? → https://whop.com/fluxfut/fluxfut-premium/`).catch(() => {});
});

client.once(Events.ClientReady, async (c) => {
  console.log(`\n✅ FluxFUT Bot online as ${c.user.tag}`);
  console.log(`📡 Serving: ${c.guilds.cache.map(g => g.name).join(", ")}`);
  c.user.setActivity("FC26 | /help", { type: 0 });

  try {
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    await rest.put(Routes.applicationCommands(c.user.id), { body: commandDefs });
    console.log(`✅ Registered ${commandDefs.length} slash commands globally`);
  } catch (e) {
    console.error("Failed to register slash commands:", e.message);
  }
});

client.on("error", (e) => console.error("Client error:", e.message));
client.login(process.env.BOT_TOKEN);
