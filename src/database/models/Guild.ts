import { Schema } from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IGuild {
  guildId: string;
  prefix: string;
  welcomeChannelId: string;
  welcomeMessage: string;
  autoRoleId: string;
  createdAt: Date;
}

const guildSchema = new Schema<IGuild>({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: '!' },
  welcomeChannelId: { type: String, default: '' },
  welcomeMessage: { type: String, default: 'Bem-vindo(a) ao Garden, {user}! A Zero Two está de olho em você.' },
  autoRoleId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export const GuildModel = createMockModel('Guild', guildSchema);
