import { UserModel, IUser } from '../../database/models/User.js';
import { AchievementService } from '../leveling/AchievementService.js';
import { RelationshipService } from '../social/RelationshipService.js';
import { Emojis } from '../../utils/emojis.js';

export class ProfileService {
  static async getProfile(userId: string, guildId: string): Promise<IUser> {
    let user = await UserModel.findOne({ userId, guildId });
    if (!user) {
      user = await UserModel.create({ userId, guildId });
    }
    return user;
  }

  static async updateBio(userId: string, guildId: string, bio: string): Promise<void> {
    await UserModel.findOneAndUpdate(
      { userId, guildId },
      { bio },
      { upsert: true, new: true },
    );
  }

  static async updateTitle(userId: string, guildId: string, title: string): Promise<void> {
    await UserModel.findOneAndUpdate(
      { userId, guildId },
      { title },
      { upsert: true, new: true },
    );
  }

  static async getProfileSummary(userId: string, guildId: string) {
    const user = await this.getProfile(userId, guildId);
    const badges = await AchievementService.getUserBadges(userId, guildId);
    const relationship = await RelationshipService.getRelationship(userId, guildId);
    
    // Formatação de Insígnias com Emojis Customizados
    let badgeString = badges.length > 0 
      ? badges.map((b: any) => b.icon).join(' ') 
      : `${Emojis.achievement} Darling Iniciante`;

    // Adicionar Insígnia VIP se possuir
    if (user.vipLevel > 0) {
      badgeString = `${Emojis.n5} **VIP Lvl ${user.vipLevel}** | ` + badgeString;
    }

    let partnerInfo = 'Solteiro(a) no Garden';
    if (relationship) {
      const partnerId = relationship.user1Id === userId ? relationship.user2Id : relationship.user1Id;
      partnerInfo = `💞 Com <@${partnerId}> (Afinidade: ${relationship.affinity || 0})`;
    }

    return {
      user,
      badgeString,
      partnerInfo
    };
  }
}
