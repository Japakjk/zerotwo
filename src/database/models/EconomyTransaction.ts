import mongoose from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IEconomyTransaction extends mongoose.Document {
  guildId: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'DAILY' | 'WORK' | 'GAMBLE' | 'REWARD';
  amount: number;
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}

const economyTransactionSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  type: { type: String, enum: ['DEPOSIT', 'WITHDRAW', 'TRANSFER', 'DAILY', 'WORK', 'GAMBLE', 'REWARD'], required: true },
  amount: { type: Number, required: true },
  reason: { type: String, default: 'Transação no Garden' },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const EconomyTransactionModel = createMockModel('EconomyTransaction', economyTransactionSchema);
