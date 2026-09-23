const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, baseEmbed, formatMs } = require('../utils/player');

module.exports = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Show the current queue').addIntegerOption(o => o.setName('page').setDescription('Page number').setMinValue(1).setRequired(false)),
  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guildId);
    if (!player?.queue?.current && !player?.queue?.tracks?.length) return interaction.reply({ embeds: [errorEmbed('Queue is empty. Use `/play` to add songs.')], ephemeral: true });
    const page = interaction.options.getInteger('page') || 1;
    const perPage = 10;
    const tracks = player.queue.tracks || [];
    const totalPages = Math.max(1, Math.ceil(tracks.length / perPage));
    const p = Math.min(page, totalPages);
    const slice = tracks.slice((p - 1) * perPage, p * perPage);

    const e = baseEmbed().setTitle(`📃 Queue — ${tracks.length} upcoming`);
    const cur = player.queue.current;
    let desc = cur ? `**Now:** [${cur.info?.title}](${cur.info?.uri}) \`${formatMs(cur.info?.duration)}\`\n\n` : '';
    desc += slice.length
      ? slice.map((t, i) => `${(p - 1) * perPage + i + 1}. [${t.info?.title}](${t.info?.uri}) \`${formatMs(t.info?.duration)}\` — <@${t.requester?.id || t.requester}>`).join('\n')
      : '_No upcoming tracks._';
    e.setDescription(desc.slice(0, 4000));
    e.setFooter({ text: `Page ${p}/${totalPages} • Loop: ${player.repeatMode || player.queue.repeatMode || 'off'} • Volume: ${player.volume}%` });
    return interaction.reply({ embeds: [e] });
  },
};
