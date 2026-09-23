const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, baseEmbed } = require('../utils/player');

module.exports = {
  data: new SlashCommandBuilder().setName('247').setDescription('Toggle 24/7 mode (stay in voice after queue ends)'),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId);
    if (!player) return interaction.reply({ embeds: [errorEmbed('Nothing is playing. Play something first, then enable 24/7.')], ephemeral: true });
    client.t247 ??= new Set();
    const on = !client.t247.has(interaction.guildId);
    if (on) client.t247.add(interaction.guildId); else client.t247.delete(interaction.guildId);
    return interaction.reply({ embeds: [baseEmbed().setTitle(on ? '🌙 24/7 Enabled' : '☀ 24/7 Disabled').setDescription(on ? 'I will stay in voice even when the queue ends.' : 'I will leave when the queue ends / channel is empty.')] });
  },
};
