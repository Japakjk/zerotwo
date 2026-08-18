import { Schema } from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface ITransaction {
  userId: string;
  guildId: string;
  amount: number;
  type: 'add' | 'remove' | 'transfer' | 'deposit' | 'withdraw';
  description: string;
  timestamp: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['add', 'remove', 'transfer', 'deposit', 'withdraw'], required: true },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const TransactionModel = createMockModel('Transaction', transactionSchema);
