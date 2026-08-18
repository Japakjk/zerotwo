import mongoose from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IModCase extends mongoose.Document {
  caseId: number;
  guildId: string;
  userId: string;
  moderatorId: string;
  action: 'BAN' | 'KICK' | 'MUTE' | 'WARN';
  reason: string;
  duration?: string;
  createdAt: Date;
}

const modCaseSchema = new mongoose.Schema({
  caseId: { type: Number, required: true },
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  moderatorId: { type: String, required: true },
  action: { type: String, enum: ['BAN', 'KICK', 'MUTE', 'WARN'], required: true },
  reason: { type: String, default: 'Nenhum motivo especificado.' },
  duration: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const ModCaseModel = createMockModel('ModCase', modCaseSchema);

export class ModCaseService {
  static async createCase(guildId: string, userId: string, moderatorId: string, action: 'BAN' | 'KICK' | 'MUTE' | 'WARN', reason: string, duration?: string): Promise<number> {
    const count = await ModCaseModel.countDocuments({ guildId });
    const caseId = count + 1;

    await ModCaseModel.create({
      caseId,
      guildId,
      userId,
      moderatorId,
      action,
      reason,
      duration,
      createdAt: new Date()
    });

    return caseId;
  }
}
