import { AchievementModel, BadgeModel } from '../../database/models/Achievement.js';
import { UserModel } from '../../database/models/User.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { TextChannel } from 'discord.js';

export const ACHIEVEMENTS = [
  { id: 'first_daily', name: 'Primeiro Passo', description: 'Resgatou seu primeiro daily.', icon: '🌅' },
  { id: 'millionaire', name: 'Milionário do Garden', description: 'Acumulou 1.000.000 de D-Coins.', icon: '💎' },
  { id: 'level_50', name: 'Elite do Franxx', description: 'Alcançou o nível 50.', icon: '⚡' },
  { id: 'streak_7', name: 'Darling Dedicado', description: 'Manteve um streak de 7 dias.', icon: '🔥' }
];

export class AchievementService {
  static async checkAchievements(userId: string, guildId: string, channel?: TextChannel) {
    const user = await UserModel.findOne({ userId, guildId });
    if (!user) return;

    const userAchievements = await AchievementModel.find({ userId, guildId });
    const earnedIds = userAchievements.map((a: any) => a.achievementId);

    // Verificações
    if (!earnedIds.includes('millionaire') && user.coins >= 1000000) {
      await this.grantAchievement(userId, guildId, 'millionaire', channel);
    }
    
    if (!earnedIds.includes('level_50') && user.level >= 50) {
      await this.grantAchievement(userId, guildId, 'level_50', channel);
    }

    if (!earnedIds.includes('streak_7') && user.streak >= 7) {
      await this.grantAchievement(userId, guildId, 'streak_7', channel);
    }
  }

  static async grantAchievement(userId: string, guildId: string, achievementId: string, channel?: TextChannel) {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;

    await AchievementModel.create({ userId, guildId, achievementId });
    
    // Também concede uma Badge automática para conquistas épicas
    await BadgeModel.create({
      userId,
      guildId,
      badgeId: achievement.id,
      name: achievement.name,
      icon: achievement.icon
    });

    if (channel) {
      const embed = new ZeroTwoEmbed()
        .setTitle('🏆 Nova Conquista Desbloqueada!')
        .setDescription(`Parabéns, Darling! Você conquistou: **${achievement.name}**\n*${achievement.description}*`)
        .setThumbnail('https://i.imgur.com/4M1q3zs.png');
      
      channel.send({ content: `<@${userId}>`, embeds: [embed] });
    }
  }

  static async getUserBadges(userId: string, guildId: string) {
    return await BadgeModel.find({ userId, guildId });
  }
}
