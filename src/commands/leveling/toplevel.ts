import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { LevelService } from '../../services/leveling/LevelService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('toplevel')
    .setDescription('Mostra os Darlings com os maiores níveis do servidor.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const leaderboard = await LevelService.getLeaderboard(interaction.guildId!);

    if (leaderboard.length === 0) {
      return interaction.editReply({ content: 'Ainda não há ninguém no ranking, Darling!' });
    }

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.rank} Top Darlings do Garden`)
      .setDescription('Aqui estão os pistoqueiros mais experientes do servidor!')
      .setThumbnail(interaction.client.user.displayAvatarURL());

    const list = leaderboard.map((user: any, index: number) => {
      const numEmoji = (Emojis as any)[`n${index + 1}`] || `**${index + 1}.**`;
      return `${numEmoji} <@${user.userId}> — Nível **${user.level}** (XP: ${user.xp.toLocaleString()})`;
    }).join('\n');

    embed.setDescription(list);

    await interaction.editReply({ embeds: [embed] });
  },
};
