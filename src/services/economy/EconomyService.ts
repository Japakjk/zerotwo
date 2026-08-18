import { UserModel } from '../../database/models/User.js';
import { EconomyTransactionModel, TransactionType } from '../../database/models/EconomyTransaction.js';
import { logger } from '../../utils/logger.js';
import { randomBytes } from 'crypto';

export class EconomyService {
  /**
   * Gera um ID de transação único.
   */
  private static generateTransactionId(): string {
    return `TX-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /**
   * Registra uma transação no banco de dados.
   */
  private static async logTransaction(data: {
    guildId: string;
    userId: string;
    targetId?: string;
    type: TransactionType;
    amount: number;
    reason: string;
    balanceBefore: number;
    balanceAfter: number;
    status?: 'COMPLETED' | 'FAILED';
  }) {
    try {
      await EconomyTransactionModel.create({
        transactionId: this.generateTransactionId(),
        ...data,
        status: data.status || 'COMPLETED',
        createdAt: new Date()
      });
    } catch (err) {
      logger.error('❌ [EconomyService] Erro ao registrar transação:', err);
    }
  }

  static async getVipLevel(userId: string, guildId: string): Promise<number> {
    const user = await UserModel.findOne({ userId, guildId });
    return user ? (user.vipLevel || 0) : 0;
  }

  static async setVipLevel(userId: string, guildId: string, level: number): Promise<void> {
    await UserModel.findOneAndUpdate(
      { userId, guildId },
      { $set: { vipLevel: level } },
      { upsert: true, new: true }
    );
  }

  static async getVipMultiplier(userId: string, guildId: string): Promise<number> {
    const level = await this.getVipLevel(userId, guildId);
    if (level <= 0) return 1.0;
    // Nível 1: 1.2x, Nível 5: 3.0x (conforme solicitado pelo Darling)
    const multipliers: Record<number, number> = { 1: 1.2, 2: 1.5, 3: 2.0, 4: 2.5, 5: 3.0 };
    return multipliers[level] || 1.0;
  }

  static async getBalance(userId: string, guildId: string) {
    let user = await UserModel.findOne({ userId, guildId });
    if (!user) {
      user = await UserModel.create({ userId, guildId });
    }
    return { coins: user.coins, bank: user.bank, total: user.coins + user.bank };
  }

  /**
   * Adiciona moedas com segurança e registro.
   */
  static async addCoins(userId: string, guildId: string, amount: number, reason: string, type: TransactionType = 'REWARD') {
    if (amount <= 0) return;

    const user = await UserModel.findOne({ userId, guildId }) || await UserModel.create({ userId, guildId });
    const before = user.coins;
    
    user.coins += amount;
    await user.save();

    await this.logTransaction({
      guildId,
      userId,
      type,
      amount,
      reason,
      balanceBefore: before,
      balanceAfter: user.coins
    });
  }

  /**
   * Remove moedas garantindo que o saldo não fique negativo.
   */
  static async removeCoins(userId: string, guildId: string, amount: number, reason: string, type: TransactionType = 'GAME'): Promise<boolean> {
    if (amount <= 0) return false;

    const user = await UserModel.findOne({ userId, guildId });
    if (!user || user.coins < amount) return false;

    const before = user.coins;
    user.coins -= amount;
    await user.save();

    await this.logTransaction({
      guildId,
      userId,
      type,
      amount: -amount,
      reason,
      balanceBefore: before,
      balanceAfter: user.coins
    });

    return true;
  }

  static async deposit(userId: string, guildId: string, amount: number): Promise<boolean> {
    const user = await UserModel.findOne({ userId, guildId });
    if (!user || user.coins < amount) return false;

    const beforeCoins = user.coins;
    user.coins -= amount;
    user.bank += amount;
    await user.save();
    
    await this.logTransaction({
      guildId,
      userId,
      type: 'SYSTEM',
      amount: -amount,
      reason: 'Depósito no banco',
      balanceBefore: beforeCoins,
      balanceAfter: user.coins
    });

    return true;
  }

  static async withdraw(userId: string, guildId: string, amount: number): Promise<boolean> {
    const user = await UserModel.findOne({ userId, guildId });
    if (!user || user.bank < amount) return false;

    const beforeCoins = user.coins;
    user.bank -= amount;
    user.coins += amount;
    await user.save();

    await this.logTransaction({
      guildId,
      userId,
      type: 'SYSTEM',
      amount: amount,
      reason: 'Saque do banco',
      balanceBefore: beforeCoins,
      balanceAfter: user.coins
    });

    return true;
  }

  /**
   * Transferência entre usuários com registro duplo e proteção.
   */
  static async transfer(fromId: string, toId: string, guildId: string, amount: number): Promise<boolean> {
    if (amount <= 0 || fromId === toId) return false;
    
    const fromUser = await UserModel.findOne({ userId: fromId, guildId });
    if (!fromUser || fromUser.coins < amount) return false;

    const toUser = await UserModel.findOne({ userId: toId, guildId }) || await UserModel.create({ userId: toId, guildId });

    const fromBefore = fromUser.coins;
    const toBefore = toUser.coins;

    fromUser.coins -= amount;
    toUser.coins += amount;

    await fromUser.save();
    await toUser.save();

    // Log para quem enviou
    await this.logTransaction({
      guildId,
      userId: fromId,
      targetId: toId,
      type: 'PAY',
      amount: -amount,
      reason: `Transferência enviada para ${toId}`,
      balanceBefore: fromBefore,
      balanceAfter: fromUser.coins
    });

    // Log para quem recebeu
    await this.logTransaction({
      guildId,
      userId: toId,
      targetId: fromId,
      type: 'PAY',
      amount: amount,
      reason: `Transferência recebida de ${fromId}`,
      balanceBefore: toBefore,
      balanceAfter: toUser.coins
    });
    
    return true;
  }

  static async claimDaily(userId: string, guildId: string): Promise<{ success: boolean; amount?: number; nextAvailable?: number }> {
    const user = await UserModel.findOne({ userId, guildId }) || await UserModel.create({ userId, guildId });
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (user.lastDaily && now - user.lastDaily.getTime() < cooldown) {
      return { success: false, nextAvailable: user.lastDaily.getTime() + cooldown };
    }

    let reward = Math.floor(Math.random() * (250000 - 100000 + 1)) + 100000;
    const multiplier = await this.getVipMultiplier(userId, guildId);
    reward = Math.floor(reward * multiplier);

    const before = user.coins;
    user.coins += reward;
    user.lastDaily = new Date();
    user.streak += 1;
    await user.save();

    await this.logTransaction({
      guildId,
      userId,
      type: 'DAILY',
      amount: reward,
      reason: `Recompensa Diária (Streak: ${user.streak})`,
      balanceBefore: before,
      balanceAfter: user.coins
    });
    
    return { success: true, amount: reward };
  }

  static async claimWeekly(userId: string, guildId: string): Promise<{ success: boolean; amount?: number; nextAvailable?: number }> {
    const user = await UserModel.findOne({ userId, guildId }) || await UserModel.create({ userId, guildId });
    const now = Date.now();
    const cooldown = 7 * 24 * 60 * 60 * 1000;

    if (user.lastWeekly && now - user.lastWeekly.getTime() < cooldown) {
      return { success: false, nextAvailable: user.lastWeekly.getTime() + cooldown };
    }

    const reward = Math.floor(Math.random() * (1000000 - 500000 + 1)) + 500000;
    const before = user.coins;
    user.coins += reward;
    user.lastWeekly = new Date();
    await user.save();

    await this.logTransaction({
      guildId,
      userId,
      type: 'REWARD',
      amount: reward,
      reason: 'Recompensa Semanal (Weekly)',
      balanceBefore: before,
      balanceAfter: user.coins
    });
    return { success: true, amount: reward };
  }

  static async claimMonthly(userId: string, guildId: string): Promise<{ success: boolean; amount?: number; nextAvailable?: number }> {
    const user = await UserModel.findOne({ userId, guildId }) || await UserModel.create({ userId, guildId });
    const now = Date.now();
    const cooldown = 30 * 24 * 60 * 60 * 1000;

    if (user.lastMonthly && now - user.lastMonthly.getTime() < cooldown) {
      return { success: false, nextAvailable: user.lastMonthly.getTime() + cooldown };
    }

    const reward = Math.floor(Math.random() * (5000000 - 2000000 + 1)) + 2000000;
    const before = user.coins;
    user.coins += reward;
    user.lastMonthly = new Date();
    await user.save();

    await this.logTransaction({
      guildId,
      userId,
      type: 'REWARD',
      amount: reward,
      reason: 'Recompensa Mensal (Monthly)',
      balanceBefore: before,
      balanceAfter: user.coins
    });
    return { success: true, amount: reward };
  }

  /**
   * Retorna o histórico de transações de um usuário.
   */
  static async getHistory(userId: string, guildId: string, limit: number = 10) {
    return await EconomyTransactionModel.find({ userId, guildId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}
