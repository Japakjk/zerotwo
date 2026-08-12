import { Schema } from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IModerationCase {
  caseId: number;
  guildId: string;
  userId: string;
  moderatorId: string;
  action: 'ban' | 'kick' | 'timeout' | 'warn' | 'unban' | 'untimeout';
  reason: string;
  duration?: string;
  timestamp: Date;
}

const moderationCaseSchema = new Schema<IModerationCase>({
  caseId: { type: Number, required: true },
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  moderatorId: { type: String, required: true },
  action: { type: String, enum: ['ban', 'kick', 'timeout', 'warn', 'unban', 'untimeout'], required: true },
  reason: { type: String, default: 'Nenhum motivo fornecido.' },
  duration: { type: String },
  timestamp: { type: Date, default: Date.now },
});

moderationCaseSchema.index({ guildId: 1, caseId: 1 }, { unique: true });

export const ModerationCaseModel = createMockModel('ModerationCase', moderationCaseSchema);
