const { EmbedBuilder } = require('discord.js');

const BRAND = 0xff0000; // YouTube red

function baseEmbed() {
  return new EmbedBuilder().setColor(BRAND).setTimestamp();
}

function formatMs(ms) {
  if (ms == null || !isFinite(ms)) return 'LIVE';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function trackTitle(track) {
  return track?.info?.title || track?.title || 'Unknown title';
}

function trackUrl(track) {
  return track?.info?.uri || track?.info?.artworkUrl || null;
}

function nowPlayingEmbed(player, track) {
  const info = track?.info || {};
  const e = baseEmbed()
    .setTitle('▶ Now Playing')
    .setDescription(`**[${trackTitle(track)}](${info.uri || 'https://youtube.com'})**\nby \`${info.author || 'Unknown'}\` • \`${formatMs(info.duration ?? info.length)}\``);
  if (info.artworkUrl) e.setThumbnail(info.artworkUrl);
  e.addFields(
    { name: 'Requested by', value: `${track?.requester?.username ? `<@${track.requester.id}>` : (track?.requester || '—')}`, inline: true },
    { name: 'Volume', value: `${player?.volume ?? 100}%`, inline: true },
    { name: 'Loop', value: `${player?.repeatMode || player?.queue?.repeatMode || 'off'}`, inline: true },
  );
  return e;
}

function addedEmbed(tracks, type, query, positionInfo = '') {
  const e = baseEmbed().setTitle(type === 'playlist' ? '📃 Playlist queued' : '🎵 Track queued');
  if (type === 'playlist') {
    e.setDescription(`Added **${tracks.length}** tracks from search/playlist:\n\`${String(query).slice(0, 200)}\`${positionInfo}`);
    const preview = tracks.slice(0, 5).map((t, i) => `${i + 1}. [${trackTitle(t)}](${t.info?.uri || 'https://youtube.com'}) \`${formatMs(t.info?.duration)}\``).join('\n');
    if (preview) e.addFields({ name: 'Preview', value: preview.slice(0, 1024) });
  } else {
    const t = tracks[0];
    e.setDescription(`**[${trackTitle(t)}](${t.info?.uri || 'https://youtube.com'})**\nby \`${t.info?.author || 'Unknown'}\` • \`${formatMs(t.info?.duration)}\`${positionInfo}`);
    if (t.info?.artworkUrl) e.setThumbnail(t.info.artworkUrl);
  }
  return e;
}

function errorEmbed(msg) {
  return baseEmbed().setColor(0xed4245).setTitle('❌ Error').setDescription(msg);
}

function getVoiceChannel(member) {
  return member?.voice?.channel || null;
}

async function ensureVoice(interaction, playerExists = false) {
  const vc = getVoiceChannel(interaction.member);
  if (!vc) {
    await interaction.reply({ embeds: [errorEmbed('Join a voice channel first.')], ephemeral: true });
    return null;
  }
  if (interaction.guild.members.me?.voice?.channel && interaction.guild.members.me.voice.channelId !== vc.id) {
    // Allow move: lavalink-client handles playerMove, but warn if already playing elsewhere
    if (playerExists) {
      await interaction.reply({ embeds: [errorEmbed(`I'm already in <#${interaction.guild.members.me.voice.channelId}>. Join me there or use \`/leave\` first.`)], ephemeral: true });
      return null;
    }
  }
  return vc;
}

module.exports = { baseEmbed, formatMs, nowPlayingEmbed, addedEmbed, errorEmbed, ensureVoice, trackTitle };
