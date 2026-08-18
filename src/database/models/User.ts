import { Schema } from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IUser {
  userId: string;
  guildId: string;
  username: string;
  displayName: string;
  joinedAt: Date;
  coins: number;
  bank: number;
  xp: number;
  level: number;
  streak: number;
  dailyStreak: number;
  lastDaily: Date | null;
  lastWeekly: Date | null;
  lastMonthly: Date | null;
  lastRep: Date | null;
  afk: { reason: string; since: Date } | null;
  vipLevel: number;
  banner: string;
  color: string;
  title: string;
  reputation: number;
  warnings: number;
  bio: string;
  messagesToday: number;
  messagesWeek: number;
  messagesMonth: number;
  messagesTotal: number;
  claimedMilestones: number[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  username: { type: String, default: '' },
  displayName: { type: String, default: '' },
  joinedAt: { type: Date, default: Date.now },
  coins: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  dailyStreak: { type: Number, default: 0 },
  lastDaily: { type: Date, default: null },
  lastWeekly: { type: Date, default: null },
  lastMonthly: { type: Date, default: null },
  lastRep: { type: Date, default: null },
  afk: {
    reason: { type: String, default: '' },
    since: { type: Date, default: null }
  },
  vipLevel: { type: Number, default: 0 },
  banner: { type: String, default: '' },
  color: { type: String, default: '#ff3b69' },
  title: { type: String, default: 'Pistoqueiro Iniciante' },
  reputation: { type: Number, default: 0 },
  warnings: { type: Number, default: 0 },
  bio: { type: String, default: 'Eu sou um Darling no Garden!' },
  messagesToday: { type: Number, default: 0 },
  messagesWeek: { type: Number, default: 0 },
  messagesMonth: { type: Number, default: 0 },
  messagesTotal: { type: Number, default: 0 },
  claimedMilestones: { type: [Number], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

export const UserModel = createMockModel('User', userSchema);
