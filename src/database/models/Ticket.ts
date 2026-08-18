import { Schema } from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface ITicket {
  guildId: string;
  userId: string;
  channelId: string;
  type: 'support' | 'vip';
  status: 'open' | 'closed';
  createdAt: Date;
  closedAt?: Date;
  closedBy?: string;
}

const ticketSchema = new Schema<ITicket>({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  channelId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['support', 'vip'], default: 'support' },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
  closedBy: { type: String },
});

// Índice para busca rápida de tickets abertos por usuário
ticketSchema.index({ guildId: 1, userId: 1, status: 1 });

export const TicketModel = createMockModel('Ticket', ticketSchema);
