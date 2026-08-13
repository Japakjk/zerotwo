import { Schema } from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IGuild {
  guildId: string;
  prefix: string;
  language: string;
  logChannels: {
    moderation: string;
    messages: string;
    members: string;
    voice: string;
  };
  moderation: {
    cases: number;
    autoMuteTime: number;
  };
  automod: {
    enabled: boolean;
    antiSpam: boolean;
    antiLinks: boolean;
    antiInvites: boolean;
  };
  antiraid: {
    enabled: boolean;
    accountAge: number;
  };
  welcome: {
    enabled: boolean;
    channelId: string;
    message: string;
  };
  goodbye: {
    enabled: boolean;
    channelId: string;
    message: string;
  };
  autoroles: string[];
  tickets: {
    enabled: boolean;
    categoryId: string;
    supportRoleId: string;
  };
  economy: {
    enabled: boolean;
    currencyName: string;
    currencyEmoji: string;
  };
  levels: {
    enabled: boolean;
    channelId: string;
    message: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const guildSchema = new Schema<IGuild>({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: 'zero!' },
  language: { type: String, default: 'pt-BR' },
  logChannels: {
    moderation: { type: String, default: '' },
    messages: { type: String, default: '' },
    members: { type: String, default: '' },
    voice: { type: String, default: '' },
  },
  moderation: {
    cases: { type: Number, default: 0 },
    autoMuteTime: { type: Number, default: 3600 },
  },
  automod: {
    enabled: { type: Boolean, default: false },
    antiSpam: { type: Boolean, default: false },
    antiLinks: { type: Boolean, default: false },
    antiInvites: { type: Boolean, default: false },
  },
  antiraid: {
    enabled: { type: Boolean, default: false },
    accountAge: { type: Number, default: 0 },
  },
  welcome: {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: '' },
    message: { type: String, default: 'Bem-vindo(a) ao Garden, {user}! A Zero Two está de olho em você.' },
  },
  goodbye: {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: '' },
    message: { type: String, default: '{user} deixou o Garden... sentiremos sua falta, Darling.' },
  },
  autoroles: { type: [String], default: [] },
  tickets: {
    enabled: { type: Boolean, default: false },
    categoryId: { type: String, default: '' },
    supportRoleId: { type: String, default: '' },
  },
  economy: {
    enabled: { type: Boolean, default: true },
    currencyName: { type: String, default: 'D-Coins' },
    currencyEmoji: { type: String, default: '💰' },
  },
  levels: {
    enabled: { type: Boolean, default: true },
    channelId: { type: String, default: '' },
    message: { type: String, default: 'Parabéns {user}, você subiu para o nível {level}!' },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const GuildModel = createMockModel('Guild', guildSchema);
