require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const { LavalinkManager } = require('lavalink-client');
const { nowPlayingEmbed, baseEmbed } = require('./utils/player');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
if (!TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in .env (copy .env.example).');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});
client.commands = new Collection();
client.t247 = new Set(); // guildIds with 24/7 enabled

// ---- Load slash commands ----
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(commandsPath, file));
  if (cmd?.data?.name && typeof cmd.execute === 'function') client.commands.set(cmd.data.name, cmd);
  else console.warn(`[commands] skipped ${file}: missing data/execute`);
}

// ---- Lavalink ----
client.lavalink = new LavalinkManager({
  nodes: [
    {
      id: 'main',
      host: process.env.LAVALINK_HOST || 'localhost',
      port: Number(process.env.LAVALINK_PORT || 2333),
      authorization: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
      secure: String(process.env.LAVALINK_SECURE || 'false').toLowerCase() === 'true',
      retryAmount: 10,
      retryDelay: 5000,
    },
  ],
  sendToShard: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  },
  autoSkip: true,
  client: { id: CLIENT_ID, username: 'YT-Player' },
  playerOptions: {
    defaultSearchPlatform: 'ytsearch',
    volumeDecrementer: 1,
    onDisconnect: { autoReconnect: true, destroyPlayer: false },
    onEmptyQueue: { destroyAfterMs: 60_000 },
  },
});

client.on(Events.Raw, (d) => client.lavalink.sendRawData(d));

// Lavalink events
client.lavalink.on('trackStart', (player, track) => {
  const ch = client.channels.cache.get(player.textChannelId);
  if (!ch?.isSendable?.()) return;
  ch.send({ embeds: [nowPlayingEmbed(player, track)] }).catch(() => {});
});

client.lavalink.on('trackError', (player, track, payload) => {
  console.error(`[lavalink] trackError guild=${player.guildId}:`, payload?.exception?.message || payload);
});

client.lavalink.on('trackStuck', (player, track, payload) => {
  console.warn(`[lavalink] trackStuck guild=${player.guildId}`, payload);
});

client.lavalink.on('queueEnd', async (player) => {
  try {
    if (client.t247.has(player.guildId)) {
      // Stay connected, announce only
      const ch = client.channels.cache.get(player.textChannelId);
      if (ch?.isSendable?.()) ch.send({ embeds: [baseEmbed().setTitle('📭 Queue ended').setDescription('Queue finished — 24/7 is ON, staying in voice. Add more with `/play`.')] }).catch(() => {});
      // Optional: leave after long idle even in 247? keep connected per feature request.
      return;
    }
    // Not 247: destroy after short grace (playerOptions.onEmptyQueue also handles it,
    // but explicit destroy is more predictable for UX)
    setTimeout(() => {
      const p = client.lavalink.getPlayer(player.guildId);
      if (!p) return;
      if (!p.queue?.current && !p.queue?.tracks?.length && !client.t247.has(p.guildId)) p.destroy('queue ended').catch(() => {});
    }, 60_000).unref?.();
  } catch {}
});

client.lavalink.nodeManager.on('connect', (node) => console.log(`[lavalink] node "${node.id}" connected`));
client.lavalink.nodeManager.on('disconnect', (node, reason) => console.warn(`[lavalink] node "${node.id}" disconnected:`, reason));
client.lavalink.nodeManager.on('error', (node, error) => console.error(`[lavalink] node "${node.id}" error:`, error?.message || error));

// Discord events
client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  try {
    client.lavalink.init({ id: c.user.id, username: c.user.username });
  } catch (e) {
    console.error('[lavalink] init failed:', e.message);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(interaction, client);
  } catch (err) {
    console.error(`[command:${interaction.commandName}]`, err);
    const msg = `Failed: ${err?.message || err}`.slice(0, 400);
    if (interaction.deferred || interaction.replied) await interaction.editReply({ content: msg }).catch(() => {});
    else await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
  }
});

// Auto-leave when channel emptied (unless 24/7)
client.on(Events.VoiceStateUpdate, async (oldState) => {
  try {
    const guildId = oldState.guild.id;
    const player = client.lavalink.getPlayer(guildId);
    if (!player?.voiceChannelId) return;
    const meCh = oldState.guild.members.me?.voice?.channelId;
    if (!meCh || meCh !== player.voiceChannelId) return;
    const channel = oldState.guild.channels.cache.get(player.voiceChannelId);
    const humansLeft = (channel?.members?.filter(m => !m.user.bot).size || 0);
    if (humansLeft === 0 && !client.t247.has(guildId)) {
      setTimeout(async () => {
        const p = client.lavalink.getPlayer(guildId);
        if (!p) return;
        const ch = oldState.guild.channels.cache.get(p.voiceChannelId);
        if ((ch?.members?.filter(m => !m.user.bot).size || 0) === 0 && !client.t247.has(guildId)) {
          await p.destroy('channel empty').catch(() => {});
        }
      }, 30_000).unref?.();
    }
  } catch {}
});

process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));

client.login(TOKEN);
