import mongoose from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IGuildConfig extends mongoose.Document {
  guildId: string;
  prefix: string;
  language: string;
  logChannels: {
    moderation?: string;
    economy?: string;
    welcome?: string;
    level?: string;
  };
  moderation: {
    enabled: boolean;
    autoMuteThreshold: number;
  };
  automod: {
    antiInvite: boolean;
    antiSpam: boolean;
    badWords: string[];
  };
  antiraid: {
    enabled: boolean;
    strictMode: boolean;
  };
  welcome: {
    enabled: boolean;
    channelId?: string;
    message?: string;
  };
  goodbye: {
    enabled: boolean;
    channelId?: string;
    message?: string;
  };
  autoroles: string[];
  tickets: {
    enabled: boolean;
    categoryId?: string;
  };
  economy: {
    enabled: boolean;
    dailyReward: number;
  };
  levels: {
    enabled: boolean;
    multiplier: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const guildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: 'z!' },
  language: { type: String, default: 'pt-BR' },
  logChannels: {
    moderation: { type: String },
    economy: { type: String },
    welcome: { type: String },
    level: { type: String }
  },
  moderation: {
    enabled: { type: Boolean, default: true },
    autoMuteThreshold: { type: Number, default: 3 }
  },
  automod: {
    antiInvite: { type: Boolean, default: true },
    antiSpam: { type: Boolean, default: false },
    badWords: { type: [String], default: [] }
  },
  antiraid: {
    enabled: { type: Boolean, default: false },
    strictMode: { type: Boolean, default: false }
  },
  welcome: {
    enabled: { type: Boolean, default: false },
    channelId: { type: String },
    message: { type: String, default: 'Bem-vindo(a) ao Garden, {user}!' }
  },
  goodbye: {
    enabled: { type: Boolean, default: false },
    channelId: { type: String },
    message: { type: String, default: '{user} partiu do Garden.' }
  },
  autoroles: { type: [String], default: [] },
  tickets: {
    enabled: { type: Boolean, default: false },
    categoryId: { type: String }
  },
  economy: {
    enabled: { type: Boolean, default: true },
    dailyReward: { type: Number, default: 50000 }
  },
  levels: {
    enabled: { type: Boolean, default: true },
    multiplier: { type: Number, default: 1 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const GuildConfigModel = createMockModel('GuildConfig', guildConfigSchema);
