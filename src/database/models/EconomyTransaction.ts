import mongoose from 'mongoose';
import { createMockModel } from './MockModel.js';

export type TransactionType = 
  | 'PAY' 
  | 'DAILY' 
  | 'ROB' 
  | 'GAME' 
  | 'PURCHASE' 
  | 'REWARD' 
  | 'ADMIN' 
  | 'SYSTEM';

export interface IEconomyTransaction extends mongoose.Document {
  transactionId: string;
  guildId: string;
  userId: string;
  targetId?: string; // Para transferências (PAY)
  type: TransactionType;
  amount: number;
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  status: 'COMPLETED' | 'FAILED';
  createdAt: Date;
}

const economyTransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  targetId: { type: String },
  type: { 
    type: String, 
    enum: ['PAY', 'DAILY', 'ROB', 'GAME', 'PURCHASE', 'REWARD', 'ADMIN', 'SYSTEM'], 
    required: true 
  },
  amount: { type: Number, required: true },
  reason: { type: String, default: 'Transação no Garden' },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  status: { type: String, enum: ['COMPLETED', 'FAILED'], default: 'COMPLETED' },
  createdAt: { type: Date, default: Date.now }
});

economyTransactionSchema.index({ userId: 1, createdAt: -1 });
economyTransactionSchema.index({ guildId: 1, createdAt: -1 });

export const EconomyTransactionModel = createMockModel('EconomyTransaction', economyTransactionSchema);
