const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, baseEmbed } = require('../utils/player');

module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop playback and clear the queue'),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId);
    if (!player) return interaction.reply({ embeds: [errorEmbed('Nothing is playing.')], ephemeral: true });
    await interaction.deferReply();
    client.t247?.delete(interaction.guildId);
    try {
      player.queue.clear();
      await player.stopPlaying(true, false);
    } catch {}
    return interaction.editReply({ embeds: [baseEmbed().setTitle('⏹ Stopped').setDescription('Playback stopped and queue cleared. Bot stays connected — use `/leave` to disconnect.')] });
  },
};
