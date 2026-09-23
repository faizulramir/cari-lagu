const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { addedEmbed, errorEmbed, ensureVoice } = require('../utils/player');

function isUrl(str) {
  try { const u = new URL(str); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a YouTube song / playlist (URL or search)')
    .addStringOption(o => o.setName('query').setDescription('YouTube URL, playlist URL, or song name').setRequired(true).setMaxLength(500))
    .addChannelOption(o => o.setName('channel').setDescription('Voice channel to join (default: yours)').addChannelTypes(ChannelType.GuildVoice).setRequired(false)),
  async execute(interaction, client) {
    await interaction.deferReply();
    const query = interaction.options.getString('query', true).trim();
    const targetChannel = interaction.options.getChannel('channel') || await ensureVoice(interaction, !!client.lavalink.getPlayer(interaction.guildId));
    if (!targetChannel) return; // ensureVoice already replied (only when no channel opt)
    if (!targetChannel?.id) return;

    const voiceChannelId = typeof targetChannel === 'object' && targetChannel.id ? targetChannel.id : targetChannel;
    // If user passed explicit channel but isn't in voice, still need permission checks
    let player = client.lavalink.getPlayer(interaction.guildId);
    if (!player) {
      player = client.lavalink.createPlayer({
        guildId: interaction.guildId,
        voiceChannelId,
        textChannelId: interaction.channelId,
        selfDeaf: true,
        selfMute: false,
        volume: Number(process.env.DEFAULT_VOLUME || 100),
      });
    } else {
      if (player.voiceChannelId !== voiceChannelId) {
        try { await player.setVoiceChannel(voiceChannelId); } catch {}
      }
      player.textChannelId = interaction.channelId;
    }
    if (!player.connected) { try { await player.connect(); } catch (e) { return interaction.editReply({ embeds: [errorEmbed(`Could not join voice: ${e.message}`)] }); } }

    // Search: pass URLs raw, otherwise YouTube search
    const source = isUrl(query) ? undefined : 'youtube';
    let res;
    try {
      res = source
        ? await player.search({ query, source }, interaction.user)
        : await player.search({ query }, interaction.user);
    } catch (e) {
      return interaction.editReply({ embeds: [errorEmbed(`Search failed: ${e.message}\nTip: if YouTube 429s, set OAuth in lavalink/application.yml or use a VPS IP.`)] });
    }

    if (!res || !res.tracks?.length) {
      return interaction.editReply({ embeds: [errorEmbed(`No results for \`${query.slice(0, 200)}\`. Try another title or a direct YouTube link.`)] });
    }

    const isPlaylist = res.type === 'playlist' || (res.playlistName && res.tracks.length > 1);
    if (isPlaylist) {
      await player.queue.add(res.tracks);
      if (!player.playing && !player.paused) { try { await player.play(); } catch (e) { return interaction.editReply({ embeds: [errorEmbed(`Queue added but playback failed: ${e.message}`)] }); } }
      return interaction.editReply({
        embeds: [addedEmbed(res.tracks, 'playlist', res.playlistName ? `${res.playlistName} — ${query}` : query, `\nQueue position: ${player.queue.size - res.tracks.length + 1}–${player.queue.size}`)],
      });
    }

    const track = res.tracks[0];
    await player.queue.add(track);
    if (!player.playing && !player.paused) { try { await player.play(); } catch (e) { return interaction.editReply({ embeds: [errorEmbed(`Track added but playback failed: ${e.message}`)] }); } }
    const pos = player.queue.current && !player.playing ? 0 : player.queue.size;
    return interaction.editReply({
      embeds: [addedEmbed([track], 'track', query, player.queue.current && (player.playing || player.paused) ? `\nPosition in queue: #${pos}` : '\nStarting playback…')],
    });
  },
};
