const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, baseEmbed } = require('../utils/player');

module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current song'),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId);
    if (!player?.queue?.current) return interaction.reply({ embeds: [errorEmbed('Nothing is playing.')], ephemeral: true });
    const title = player.queue.current.info?.title || 'Unknown';
    await interaction.deferReply();
    try { await player.skip(); } catch (e) { return interaction.editReply({ embeds: [errorEmbed(`Skip failed: ${e.message}`)] }); }
    return interaction.editReply({ embeds: [baseEmbed().setTitle('⏭ Skipped').setDescription(`Skipped **${title}**`)] });
  },
};
