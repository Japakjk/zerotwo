import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { AchievementModel } from '../../database/models/Achievement.js';
import { ACHIEVEMENTS } from '../../services/leveling/AchievementService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('conquistas')
    .setDescription('Veja suas conquistas e desafios no Garden.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const userAchievements = await AchievementModel.find({ 
      userId: interaction.user.id, 
      guildId: interaction.guildId! 
    });
    
    const earnedIds = userAchievements.map((a: any) => a.achievementId);

    const embed = new ZeroTwoEmbed()
      .setTitle('🏆 Suas Conquistas')
      .setDescription('Aqui está o seu progresso nos desafios da Zero Two, Darling!');

    const list = ACHIEVEMENTS.map(ach => {
      const isEarned = earnedIds.includes(ach.id);
      return `${isEarned ? '✅' : '🔒'} **${ach.name}**\n*${ach.description}*`;
    }).join('\n\n');

    embed.addFields({ name: 'Lista de Desafios', value: list });

    await interaction.editReply({ embeds: [embed] });
  },
};
