const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../utils/player');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show all music commands'),
  async execute(interaction) {
    const e = baseEmbed()
      .setTitle('🎶 YouTube Player — Help')
      .setDescription([
        '`/play <name or URL>` — play song / playlist (YouTube search supported)',
        '`/pause` `/resume` `/skip` `/stop` — basic controls',
        '`/queue [page]` — show queue',
        '`/nowplaying` — current song + progress',
        '`/loop <off|track|queue>` — repeat mode',
        '`/volume <0-150>` — loudness',
        '`/shuffle` — randomize queue',
        '`/filters <nightcore|vaporwave|8d|karaoke|bass|clear>` — audio FX',
        '`/247` — stay in voice 24/7',
        '`/leave` — disconnect',
        '',
        'YouTube playlists: just `/play` a playlist URL (up to 100 tracks load by default).',
      ].join('\n'));
    return interaction.reply({ embeds: [e], ephemeral: true });
  },
};
