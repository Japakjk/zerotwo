import { UserModel } from '../../database/models/User.js';

export class CooldownService {
  private static cooldowns: Map<string, Map<string, number>> = new Map();
  
  // Cooldowns específicos para comandos de economia/social (15-20 min)
  private static specialCommands = ['work', 'beijar', 'abracar', 'cafune', 'socar', 'tapa', 'acariciar', 'cosquinha', 'dancar', 'flertar', 'provocar'];

  static async checkCooldown(userId: string, guildId: string, commandName: string): Promise<{ inCooldown: boolean; remaining: number }> {
    const user = await UserModel.findOne({ userId, guildId }) || await UserModel.create({ userId, guildId });
    const vipLevel = user.vipLevel || 0;

    if (!this.cooldowns.has(commandName)) {
      this.cooldowns.set(commandName, new Map());
    }

    const now = Date.now();
    const timestamps = this.cooldowns.get(commandName)!;
    
    // Cooldown Base
    let cooldownAmount = 5000; // 5 segundos global

    // Se for comando especial, cooldown é de 15 a 20 min
    if (this.specialCommands.includes(commandName)) {
      cooldownAmount = (Math.floor(Math.random() * (20 - 15 + 1)) + 15) * 60 * 1000;
    }

    // Redução de Cooldown por VIP (10% por nível, VIP 5 = 50% de redução)
    const reduction = vipLevel * 0.10;
    cooldownAmount = Math.floor(cooldownAmount * (1 - reduction));

    if (timestamps.has(userId)) {
      const expirationTime = timestamps.get(userId)!;
      if (now < expirationTime) {
        return { inCooldown: true, remaining: (expirationTime - now) / 1000 };
      }
    }

    timestamps.set(userId, now + cooldownAmount);
    setTimeout(() => timestamps.delete(userId), cooldownAmount);
    
    return { inCooldown: false, remaining: 0 };
  }
}
