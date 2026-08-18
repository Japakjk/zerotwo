import { UserModel } from '../../database/models/User.js';

export interface CooldownResult {
  inCooldown: boolean;
  remaining: number;
  remainingFormatted: string;
}

export class CooldownService {
  private static cooldowns: Map<string, Map<string, number>> = new Map();
  
  private static specialCommands = ['work', 'beijar', 'abracar', 'cafune', 'socar', 'tapa', 'acariciar', 'cosquinha', 'dancar', 'flertar', 'provocar', 'olhar', 'cumprimentar'];

  static async checkCooldown(userId: string, guildId: string, commandName: string): Promise<CooldownResult> {
    const user = await UserModel.findOne({ userId, guildId }) || await UserModel.create({ userId, guildId });
    const vipLevel = user.vipLevel || 0;

    if (!this.cooldowns.has(commandName)) {
      this.cooldowns.set(commandName, new Map());
    }

    const now = Date.now();
    const timestamps = this.cooldowns.get(commandName)!;
    
    let cooldownAmount = 5000;

    if (this.specialCommands.includes(commandName)) {
      cooldownAmount = (Math.floor(Math.random() * (20 - 15 + 1)) + 15) * 60 * 1000;
    }

    const reduction = Math.min(vipLevel * 0.10, 0.50);
    cooldownAmount = Math.floor(cooldownAmount * (1 - reduction));

    if (timestamps.has(userId)) {
      const expirationTime = timestamps.get(userId)!;
      if (now < expirationTime) {
        const remaining = (expirationTime - now) / 1000;
        return { 
          inCooldown: true, 
          remaining,
          remainingFormatted: this.formatTime(remaining)
        };
      }
    }
    
    return { inCooldown: false, remaining: 0, remainingFormatted: '0s' };
  }

  static async setCooldown(userId: string, guildId: string, commandName: string) {
    if (!this.cooldowns.has(commandName)) {
      this.cooldowns.set(commandName, new Map());
    }

    const user = await UserModel.findOne({ userId, guildId });
    const vipLevel = user?.vipLevel || 0;
    const timestamps = this.cooldowns.get(commandName)!;
    const now = Date.now();

    let cooldownAmount = 5000;
    if (this.specialCommands.includes(commandName)) {
      cooldownAmount = (Math.floor(Math.random() * (20 - 15 + 1)) + 15) * 60 * 1000;
    }

    const reduction = Math.min(vipLevel * 0.10, 0.50);
    cooldownAmount = Math.floor(cooldownAmount * (1 - reduction));

    timestamps.set(userId, now + cooldownAmount);
    setTimeout(() => timestamps.delete(userId), cooldownAmount);
  }

  private static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }
}
