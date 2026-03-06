require("dotenv").config();
const { Client, GatewayIntentBits, Collection, Events } = require("discord.js");
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
client.on("messageCreate", (msg) => console.log("Message received:", msg.content));


const cmdDir = path.join(__dirname, "commands");
console.log("Commands folder contents:", fs.readdirSync(cmdDir));
for (const file of fs.readdirSync(cmdDir).filter(f => f.endsWith(".js"))) {
  try {
    const cmd = require(path.join(cmdDir, file));
    if (cmd && cmd.name) {
      client.commands.set(cmd.name, cmd);
      console.log(`✅ Loaded command: ${cmd.name}`);
    }
  } catch (e) {
    console.error(`❌ Failed to load command ${file}:`, e.message);
  }
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("!")) return;
  const args    = message.content.slice(1).trim().split(/\s+/);
  const cmdName = args.shift().toLowerCase();
  const command = client.commands.get(cmdName);
  if (!command) return;
  try {
    await command.execute(message, args, client);
  } catch (e) {
    console.error(`Command error [${cmdName}]:`, e.message);
    message.reply("Something went wrong.").catch(() => {});
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

client.once(Events.ClientReady, (c) => {
  console.log(`\n✅ FluxFUT Bot online as ${c.user.tag}`);
  console.log(`📡 Serving: ${c.guilds.cache.map(g => g.name).join(", ")}`);
  c.user.setActivity("FC26 | !help", { type: 0 });
});

client.on("error", (e) => console.error("Client error:", e.message));

client.login(process.env.BOT_TOKEN);