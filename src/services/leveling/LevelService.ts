import { UserModel } from '../../database/models/User.js';
import { GuildModel } from '../../database/models/Guild.js';
import { EconomyService } from '../economy/EconomyService.js';

export class LevelService {
  private static xpCooldowns = new Map<string, number>();

  static getXPForLevel(level: number): number {
    return 5 * (level ** 2) + 50 * level + 100;
  }

  static async addXP(userId: string, guildId: string, amount: number, userDoc?: any, guildDoc?: any): Promise<{ leveledUp: boolean; newLevel: number } | null> {
    const cooldownKey = `${userId}-${guildId}`;
    const now = Date.now();
    
    // Anti-spam: 1 minuto de cooldown para ganhar XP
    if (this.xpCooldowns.has(cooldownKey) && now < this.xpCooldowns.get(cooldownKey)!) {
      return null;
    }

    const guild = guildDoc || await GuildModel.findOne({ guildId });
    if (guild && !guild.levels?.enabled) return null;

    let user = userDoc || await UserModel.findOne({ userId, guildId });
    if (!user) {
      user = await UserModel.create({ userId, guildId });
    }

    // Bônus de XP para VIPs (20% por nível VIP) + Multiplicador da Guilda
    const vipLevel = user.vipLevel || 0;
    const vipMultiplier = 1 + (vipLevel * 0.20);
    const guildMultiplier = guild?.levels?.xpMultiplier || 1.0;
    
    const finalAmount = Math.floor(amount * vipMultiplier * guildMultiplier);

    user.xp += finalAmount;
    
    this.xpCooldowns.set(cooldownKey, now + 60000);

    let leveledUp = false;
    while (user.xp >= this.getXPForLevel(user.level)) {
      user.xp -= this.getXPForLevel(user.level);
      user.level += 1;
      leveledUp = true;
      
      // Bônus de economia por subir de nível
      const levelReward = user.level * 5000;
      await EconomyService.addCoins(userId, guildId, levelReward, `Recompensa de Level Up (Nível ${user.level})`);
    }

    if (!userDoc) await user.save();
    return { leveledUp, newLevel: user.level };
  }

  static async handleLevelRoles(member: any, newLevel: number) {
    const guild = await GuildModel.findOne({ guildId: member.guild.id });
    if (!guild || !guild.levels?.levelRoles) return;

    const levelRoles = guild.levels.levelRoles;
    const roleId = levelRoles.get(newLevel.toString());

    if (roleId) {
      const role = member.guild.roles.cache.get(roleId);
      if (role) {
        await member.roles.add(role).catch(() => {});
      }
    }
  }

  static async getLeaderboard(guildId: string, limit: number = 10) {
    return await UserModel.find({ guildId }).sort({ level: -1, xp: -1 }).limit(limit);
  }
}
