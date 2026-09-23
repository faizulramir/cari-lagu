const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, baseEmbed } = require('../utils/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set playback volume (0-150)')
    .addIntegerOption(o => o.setName('level').setDescription('Volume %').setRequired(true).setMinValue(0).setMaxValue(150)),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId);
    if (!player) return interaction.reply({ embeds: [errorEmbed('Nothing is playing.')], ephemeral: true });
    const level = interaction.options.getInteger('level', true);
    try { await player.setVolume(level); } catch (e) { return interaction.reply({ embeds: [errorEmbed(`Failed: ${e.message}`)], ephemeral: true }); }
    return interaction.reply({ embeds: [baseEmbed().setTitle('🔊 Volume').setDescription(`Volume set to **${level}%**`)] });
  },
};
