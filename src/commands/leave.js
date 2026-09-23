const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, baseEmbed } = require('../utils/player');

module.exports = {
  data: new SlashCommandBuilder().setName('leave').setDescription('Disconnect the bot and clear the queue'),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId);
    if (!player) return interaction.reply({ embeds: [errorEmbed('I am not connected.')], ephemeral: true });
    await interaction.deferReply();
    client.t247?.delete(interaction.guildId);
    try { await player.destroy('leave command'); } catch {}
    return interaction.editReply({ embeds: [baseEmbed().setTitle('👋 Disconnected').setDescription('Left the voice channel and cleared the queue.')] });
  },
};
