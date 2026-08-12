import { EconomyTransactionModel } from '../../database/models/EconomyTransaction.js';

export class EconomyTransactionService {
  static async logTransaction(
    guildId: string,
    userId: string,
    type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'DAILY' | 'WORK' | 'GAMBLE' | 'REWARD',
    amount: number,
    reason: string,
    balanceBefore: number,
    balanceAfter: number
  ) {
    try {
      await EconomyTransactionModel.create({
        guildId,
        userId,
        type,
        amount,
        reason,
        balanceBefore,
        balanceAfter,
        createdAt: new Date()
      });
    } catch (err) {
      console.error('Erro ao registrar transação financeira:', err);
    }
  }
}
