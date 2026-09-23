const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, baseEmbed } = require('../utils/player');

module.exports = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume playback'),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId);
    if (!player?.queue?.current) return interaction.reply({ embeds: [errorEmbed('Nothing is playing.')], ephemeral: true });
    try { await player.pause(false); } catch (e) { return interaction.reply({ embeds: [errorEmbed(`Failed: ${e.message}`)], ephemeral: true }); }
    return interaction.reply({ embeds: [baseEmbed().setTitle('▶ Resumed').setDescription('Playback resumed.')] });
  },
};
