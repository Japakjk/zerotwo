import { Schema } from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IAchievement {
  userId: string;
  guildId: string;
  achievementId: string;
  earnedAt: Date;
}

const achievementSchema = new Schema<IAchievement>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  achievementId: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
});

achievementSchema.index({ userId: 1, guildId: 1, achievementId: 1 }, { unique: true });

export const AchievementModel = createMockModel('Achievement', achievementSchema);

export interface IBadge {
  userId: string;
  guildId: string;
  badgeId: string;
  icon: string;
  name: string;
  earnedAt: Date;
}

const badgeSchema = new Schema<IBadge>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  badgeId: { type: String, required: true },
  icon: { type: String, required: true },
  name: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
});

export const BadgeModel = createMockModel('Badge', badgeSchema);
