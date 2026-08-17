import { Schema, model } from 'mongoose';

const blacklistSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  reason: { type: String, default: 'Nenhum motivo informado' },
  moderatorId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const BlacklistModel = model('Blacklist', blacklistSchema);
