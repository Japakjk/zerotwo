import { UserModel } from '../../database/models/User.js';
import { TransactionModel } from '../../database/models/Transaction.js';

export class EconomyService {
  static async getVipMultiplier(userId: string, guildId: string): Promise<number> {
    const user = await UserModel.findOne({ userId, guildId });
    if (!user) return 1.0;
    // Bônus VIP: 20% por nível (VIP 5 = 100% de bônus, ou seja, 2x)
    return 1 + (user.vipLevel * 0.20);
  }

  static async getBalance(userId: string, guildId: string) {
    let user = await UserModel.findOne({ userId, guildId });
    if (!user) {
      user = await UserModel.create({ userId, guildId });
    }
    return { coins: user.coins, bank: user.bank };
  }

  static async addCoins(userId: string, guildId: string, amount: number, description: string) {
    if (amount <= 0) return;
    await UserModel.findOneAndUpdate(
      { userId, guildId },
      { $inc: { coins: amount } },
      { upsert: true, new: true },
    );
    await TransactionModel.create({ userId, guildId, amount, type: 'add', description });
  }

  static async removeCoins(userId: string, guildId: string, amount: number): Promise<boolean> {
    if (amount <= 0) return false;
    const user = await UserModel.findOne({ userId, guildId });
    if (!user || user.coins < amount) return false;

    user.coins -= amount;
    await user.save();
    
    await TransactionModel.create({ userId, guildId, amount, type: 'remove', description: 'Aposta em Jogo' });
    return true;
  }

  static async deposit(userId: string, guildId: string, amount: number): Promise<boolean> {
    const user = await UserModel.findOne({ userId, guildId });
    if (!user || user.coins < amount) return false;

    user.coins -= amount;
    user.bank += amount;
    await user.save();
    
    await TransactionModel.create({ userId, guildId, amount, type: 'deposit', description: 'Depósito no banco' });
    return true;
  }

  static async withdraw(userId: string, guildId: string, amount: number): Promise<boolean> {
    const user = await UserModel.findOne({ userId, guildId });
    if (!user || user.bank < amount) return false;

    user.bank -= amount;
    user.coins += amount;
    await user.save();

    await TransactionModel.create({ userId, guildId, amount, type: 'withdraw', description: 'Saque do banco' });
    return true;
  }

  static async transfer(fromId: string, toId: string, guildId: string, amount: number): Promise<boolean> {
    if (amount <= 0 || fromId === toId) return false;
    
    const fromUser = await UserModel.findOne({ userId: fromId, guildId });
    if (!fromUser || fromUser.coins < amount) return false;

    fromUser.coins -= amount;
    await fromUser.save();

    await UserModel.findOneAndUpdate(
      { userId: toId, guildId },
      { $inc: { coins: amount } },
      { upsert: true }
    );

    await TransactionModel.create({ userId: fromId, guildId, amount, type: 'transfer', description: `Transferência para ${toId}` });
    await TransactionModel.create({ userId: toId, guildId, amount, type: 'transfer', description: `Recebido de ${fromId}` });
    
    return true;
  }

  static async claimDaily(userId: string, guildId: string): Promise<{ success: boolean; amount?: number; nextAvailable?: number }> {
    const user = await UserModel.findOne({ userId, guildId }) || await UserModel.create({ userId, guildId });
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000; // 24h

    if (user.lastDaily && now - user.lastDaily.getTime() < cooldown) {
      return { success: false, nextAvailable: user.lastDaily.getTime() + cooldown };
    }

    let reward = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
    const multiplier = await this.getVipMultiplier(userId, guildId);
    reward = Math.floor(reward * multiplier);

    user.coins += reward;
    user.lastDaily = new Date();
    user.streak += 1;
    await user.save();

    await TransactionModel.create({ userId, guildId, amount: reward, type: 'add', description: 'Recompensa Diária (Daily)' });
    
    return { success: true, amount: reward };
  }

  static async claimWeekly(userId: string, guildId: string): Promise<{ success: boolean; amount?: number; nextAvailable?: number }> {
    const user = await UserModel.findOne({ userId, guildId }) || await UserModel.create({ userId, guildId });
    const now = Date.now();
    const cooldown = 7 * 24 * 60 * 60 * 1000;

    if (user.lastWeekly && now - user.lastWeekly.getTime() < cooldown) {
      return { success: false, nextAvailable: user.lastWeekly.getTime() + cooldown };
    }

    const reward = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000;
    user.coins += reward;
    user.lastWeekly = new Date();
    await user.save();

    await TransactionModel.create({ userId, guildId, amount: reward, type: 'add', description: 'Recompensa Semanal (Weekly)' });
    return { success: true, amount: reward };
  }

  static async claimMonthly(userId: string, guildId: string): Promise<{ success: boolean; amount?: number; nextAvailable?: number }> {
    const user = await UserModel.findOne({ userId, guildId }) || await UserModel.create({ userId, guildId });
    const now = Date.now();
    const cooldown = 30 * 24 * 60 * 60 * 1000;

    if (user.lastMonthly && now - user.lastMonthly.getTime() < cooldown) {
      return { success: false, nextAvailable: user.lastMonthly.getTime() + cooldown };
    }

    const reward = Math.floor(Math.random() * (100000 - 50000 + 1)) + 50000;
    user.coins += reward;
    user.lastMonthly = new Date();
    await user.save();

    await TransactionModel.create({ userId, guildId, amount: reward, type: 'add', description: 'Recompensa Mensal (Monthly)' });
    return { success: true, amount: reward };
  }
}
