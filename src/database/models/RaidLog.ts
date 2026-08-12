import mongoose from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IRaidLog extends mongoose.Document {
  guildId: string;
  userId: string;
  action: 'JOIN_SPAM' | 'MASS_MENTION' | 'BOT_ATTACK';
  reason: string;
  detectedAt: Date;
  metadata: Record<string, any>;
}

const raidLogSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  action: { type: String, enum: ['JOIN_SPAM', 'MASS_MENTION', 'BOT_ATTACK'], required: true },
  reason: { type: String, default: 'Atividade suspeita detectada pelo Anti-Raid' },
  detectedAt: { type: Date, default: Date.now },
  metadata: { type: Object, default: {} }
});

export const RaidLogModel = createMockModel('RaidLog', raidLogSchema);
