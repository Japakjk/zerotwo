import { Schema } from 'mongoose';
import { createMockModel } from './MockModel.js';
import { config } from '../../config/config.js';

export interface IGuild {
  guildId: string;
  prefix: string;
  language: string;
  logsEnabled: boolean;
  logChannels: {
    join: string;
    leave: string;
    messages: string;
    voice: string;
    bans: string;
    rolesAddRemove: string;
    rolesCreateEdit: string;
    channelsCreateEdit: string;
  };
  moderation: {
    cases: number;
    autoMuteTime: number;
  };
  automod: {
    enabled: boolean;
    antiSpam: boolean;
    antiFlood: boolean;
    antiLinks: boolean;
    antiInvites: boolean;
    antiMentions: number;
    maxRepeated: number;
  };
  antiraid: {
    enabled: boolean;
    accountAge: number;
    massJoinLimit: number;
    massJoinTime: number;
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
    levelRoles: Map<string, string>;
    xpMultiplier: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const guildSchema = new Schema<IGuild>({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: config.DEFAULT_PREFIX },
  language: { type: String, default: 'pt-BR' },
  logsEnabled: { type: Boolean, default: false },
  logChannels: {
    join: { type: String, default: '' },
    leave: { type: String, default: '' },
    messages: { type: String, default: '' },
    voice: { type: String, default: '' },
    bans: { type: String, default: '' },
    rolesAddRemove: { type: String, default: '' },
    rolesCreateEdit: { type: String, default: '' },
    channelsCreateEdit: { type: String, default: '' },
  },
  moderation: {
    cases: { type: Number, default: 0 },
    autoMuteTime: { type: Number, default: 3600 },
  },
  automod: {
    enabled: { type: Boolean, default: false },
    antiSpam: { type: Boolean, default: false },
    antiFlood: { type: Boolean, default: false },
    antiLinks: { type: Boolean, default: false },
    antiInvites: { type: Boolean, default: false },
    antiMentions: { type: Number, default: 0 },
    maxRepeated: { type: Number, default: 0 },
  },
  antiraid: {
    enabled: { type: Boolean, default: false },
    accountAge: { type: Number, default: 0 },
    massJoinLimit: { type: Number, default: 0 },
    massJoinTime: { type: Number, default: 10 },
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
    levelRoles: { type: Map, of: String, default: new Map() },
    xpMultiplier: { type: Number, default: 1.0 },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const GuildModel = createMockModel('Guild', guildSchema);
