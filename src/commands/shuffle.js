const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, baseEmbed } = require('../utils/player');

module.exports = {
  data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle the queue'),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId);
    if (!player?.queue?.tracks?.length) return interaction.reply({ embeds: [errorEmbed('Queue is empty.')], ephemeral: true });
    try { await player.queue.shuffle(); } catch (e) { return interaction.reply({ embeds: [errorEmbed(`Failed: ${e.message}`)], ephemeral: true }); }
    return interaction.reply({ embeds: [baseEmbed().setTitle('🔀 Shuffled').setDescription(`Queue shuffled (${player.queue.tracks.length} tracks).`)] });
  },
};
