const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, baseEmbed } = require('../utils/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set loop mode')
    .addStringOption(o => o.setName('mode').setDescription('Loop mode').setRequired(true)
      .addChoices({ name: 'Off', value: 'off' }, { name: 'Track', value: 'track' }, { name: 'Queue', value: 'queue' })),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId);
    if (!player) return interaction.reply({ embeds: [errorEmbed('Nothing is playing.')], ephemeral: true });
    const mode = interaction.options.getString('mode', true);
    try {
      if (typeof player.setRepeatMode === 'function') await player.setRepeatMode(mode);
      else if (player.queue && typeof player.queue.setRepeatMode === 'function') await player.queue.setRepeatMode(mode);
      else throw new Error('repeat mode not supported by client version');
    } catch (e) { return interaction.reply({ embeds: [errorEmbed(`Failed: ${e.message}`)], ephemeral: true }); }
    const label = mode === 'off' ? 'Off' : mode === 'track' ? '🔂 Track' : '🔁 Queue';
    return interaction.reply({ embeds: [baseEmbed().setTitle('🔁 Loop').setDescription(`Loop mode set to **${label}**`)] });
  },
};
