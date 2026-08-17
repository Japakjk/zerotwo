import { Schema } from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IBotStats {
  botId: string;
  totalCommands: number;
  totalMessages: number;
  totalErrors: number;
  commandUsage: Map<string, number>;
  updatedAt: Date;
}

const botStatsSchema = new Schema<IBotStats>({
  botId: { type: String, required: true, unique: true },
  totalCommands: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
  totalErrors: { type: Number, default: 0 },
  commandUsage: { type: Map, of: Number, default: new Map() },
  updatedAt: { type: Date, default: Date.now }
});

export const BotStatsModel = createMockModel('BotStats', botStatsSchema);
