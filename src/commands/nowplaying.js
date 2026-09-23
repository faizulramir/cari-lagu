const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, nowPlayingEmbed, formatMs } = require('../utils/player');

module.exports = {
  data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show the currently playing song'),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId);
    const track = player?.queue?.current;
    if (!track) return interaction.reply({ embeds: [errorEmbed('Nothing is playing.')], ephemeral: true });
    const embed = nowPlayingEmbed(player, track);
    const pos = player.position ?? 0;
    const dur = track.info?.duration;
    if (dur && isFinite(dur) && dur > 0) {
      const pct = Math.min(1, pos / dur);
      const barLen = 15;
      const filled = Math.round(pct * barLen);
      const bar = '▬'.repeat(Math.max(0, filled - 1)) + '🔘' + '▬'.repeat(Math.max(0, barLen - filled));
      embed.addFields({ name: 'Progress', value: `\`${formatMs(pos)} / ${formatMs(dur)}\`\n${bar}`, inline: false });
    }
    return interaction.reply({ embeds: [embed] });
  },
};
