import mongoose from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IWarning extends mongoose.Document {
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: Date;
  expiresAt?: Date;
}

const warningSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  moderatorId: { type: String, required: true },
  reason: { type: String, default: 'Nenhum motivo especificado.' },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

export const WarningModel = createMockModel('Warning', warningSchema);
