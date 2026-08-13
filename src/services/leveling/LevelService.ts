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

    // Bônus de XP para VIPs (20% por nível VIP)
    const vipLevel = user.vipLevel || 0;
    const xpMultiplier = 1 + (vipLevel * 0.20);
    const finalAmount = Math.floor(amount * xpMultiplier);

    user.xp += finalAmount;
    user.messagesTotal = (user.messagesTotal || 0) + 1;
    user.messagesToday = (user.messagesToday || 0) + 1;
    
    this.xpCooldowns.set(cooldownKey, now + 60000);

    let leveledUp = false;
    while (user.xp >= this.getXPForLevel(user.level)) {
      user.xp -= this.getXPForLevel(user.level);
      user.level += 1;
      leveledUp = true;
      
      // Bônus de economia por subir de nível (10k a 50k conforme o nível)
      const levelReward = user.level * 5000;
      await EconomyService.addCoins(userId, guildId, levelReward, `Recompensa de Level Up (Nível ${user.level})`);
    }

    await user.save();
    return { leveledUp, newLevel: user.level };
  }

  static async getLeaderboard(guildId: string, limit: number = 10) {
    return await UserModel.find({ guildId }).sort({ level: -1, xp: -1 }).limit(limit);
  }
}
