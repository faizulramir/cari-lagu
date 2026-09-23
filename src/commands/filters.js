const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, baseEmbed } = require('../utils/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filters')
    .setDescription('Toggle audio filters')
    .addStringOption(o => o.setName('preset').setDescription('Filter preset').setRequired(true)
      .addChoices(
        { name: 'Clear / Off', value: 'clear' },
        { name: 'Nightcore', value: 'nightcore' },
        { name: 'Vaporwave', value: 'vaporwave' },
        { name: '8D', value: '8d' },
        { name: 'Karaoke', value: 'karaoke' },
        { name: 'Bass boost', value: 'bass' },
      )),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId);
    if (!player?.queue?.current) return interaction.reply({ embeds: [errorEmbed('Nothing is playing.')], ephemeral: true });
    const preset = interaction.options.getString('preset', true);
    await interaction.deferReply();
    const fm = player.filterManager;
    try {
      if (typeof fm.resetFilters === 'function') await fm.resetFilters();
      else if (typeof fm.clearEffects === 'function') await fm.clearEffects();

      switch (preset) {
        case 'nightcore':
          if (typeof fm.setNightcore === 'function') await fm.setNightcore(true);
          else if (typeof fm.setTimescale === 'function') await fm.setTimescale({ speed: 1.25, pitch: 1.25, rate: 1.0 });
          break;
        case 'vaporwave':
          if (typeof fm.setVaporwave === 'function') await fm.setVaporwave(true);
          else if (typeof fm.setTimescale === 'function') await fm.setTimescale({ speed: 0.8, pitch: 0.8, rate: 1.0 });
          break;
        case '8d':
          if (typeof fm.set8D === 'function') await fm.set8D(true);
          else if (typeof fm.setRotation === 'function') await fm.setRotation({ rotationHz: 0.2 });
          break;
        case 'karaoke':
          if (typeof fm.setKaraoke === 'function') await fm.setKaraoke(true);
          break;
        case 'bass':
          if (typeof fm.setEQ === 'function') await fm.setEQ(Array(15).fill(0).map((_, i) => ({ band: i, gain: i <= 2 ? 0.3 : 0 })));
          else if (typeof fm.setEqualizer === 'function') await fm.setEqualizer(Array(15).fill(0).map((_, i) => ({ band: i, gain: i <= 2 ? 0.3 : 0 })));
          break;
        case 'clear':
        default:
          break;
      }
    } catch (e) {
      return interaction.editReply({ embeds: [errorEmbed(`Filter failed (does your Lavalink enable filters?): ${e.message}`)] });
    }
    return interaction.editReply({ embeds: [baseEmbed().setTitle('🎛 Filters').setDescription(preset === 'clear' ? 'All filters cleared.' : `Filter applied: **${preset}**`)] });
  },
};
