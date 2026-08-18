import mongoose from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IModLog extends mongoose.Document {
  guildId: string;
  userId: string;
  moderatorId: string;
  action: string;
  reason: string;
  duration?: string;
  createdAt: Date;
}

const modLogSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  moderatorId: { type: String, required: true },
  action: { type: String, required: true },
  reason: { type: String, default: 'Nenhum motivo especificado.' },
  duration: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const ModLogModel = createMockModel('moderation_logs', modLogSchema);
