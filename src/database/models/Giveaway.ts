import { Schema, model, Document } from 'mongoose';

export interface IGiveaway extends Document {
  guildId: string;
  channelId: string;
  messageId: string;
  prize: string;
  title?: string;
  endsAt: Date;
  winnerCount: number;
  hostId: string;
  status: 'active' | 'ended';
  winners?: string[];
  participants?: string[];
  color?: string;
  image?: string;
  buttonEmoji?: string;
  requiredRoleIds?: string[];
  minAccountAgeDays?: number;
}

const GiveawaySchema = new Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true, unique: true },
  prize: { type: String, required: true },
  title: { type: String, default: 'SORTEIO DA ZERO TWO' },
  endsAt: { type: Date, required: true },
  winnerCount: { type: Number, default: 1 },
  hostId: { type: String, required: true },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  winners: [{ type: String }],
  participants: [{ type: String }],
  color: { type: String, default: '#ff3b69' },
  image: { type: String },
  buttonEmoji: { type: String, default: '🎁' },
  requiredRoleIds: [{ type: String }],
  minAccountAgeDays: { type: Number, default: 0 }
}, { timestamps: true });

export const GiveawayModel = model<IGiveaway>('Giveaway', GiveawaySchema);
