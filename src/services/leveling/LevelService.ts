import { UserModel } from '../../database/models/User.js';
import { EconomyService } from '../economy/EconomyService.js';

export class LevelService {
  private static xpCooldowns = new Map<string, number>();

  static getXPForLevel(level: number): number {
    return 5 * (level ** 2) + 50 * level + 100;
  }

  static async addXP(userId: string, guildId: string, amount: number): Promise<{ leveledUp: boolean; newLevel: number } | null> {
    const cooldownKey = `${userId}-${guildId}`;
    const now = Date.now();
    
    // Anti-spam: 1 minuto de cooldown para ganhar XP
    if (this.xpCooldowns.has(cooldownKey) && now < this.xpCooldowns.get(cooldownKey)!) {
      return null;
    }

    let user = await UserModel.findOne({ userId, guildId });
    if (!user) {
      user = await UserModel.create({ userId, guildId });
    }

    user.xp += amount;
    this.xpCooldowns.set(cooldownKey, now + 60000);

    let leveledUp = false;
    while (user.xp >= this.getXPForLevel(user.level)) {
      user.xp -= this.getXPForLevel(user.level);
      user.level += 1;
      leveledUp = true;
      
      // Bônus de economia por subir de nível
      await EconomyService.addCoins(userId, guildId, user.level * 100, `Level Up Reward (Level ${user.level})`);
    }

    await user.save();
    return { leveledUp, newLevel: user.level };
  }

  static async getLeaderboard(guildId: string, limit: number = 10) {
    return await UserModel.find({ guildId }).sort({ level: -1, xp: -1 }).limit(limit);
  }
}
