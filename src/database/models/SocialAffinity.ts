import { Schema } from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface ISocialAffinity {
  guildId: string;
  user1Id: string;
  user2Id: string;
  affinity: number;
  successes: number;
  failures: number;
  lastInteractionAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const socialAffinitySchema = new Schema<ISocialAffinity>({
  guildId: { type: String, required: true },
  user1Id: { type: String, required: true },
  user2Id: { type: String, required: true },
  affinity: { type: Number, min: 0, max: 100, default: 0 },
  successes: { type: Number, min: 0, default: 0 },
  failures: { type: Number, min: 0, default: 0 },
  lastInteractionAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

socialAffinitySchema.index({ guildId: 1, user1Id: 1, user2Id: 1 }, { unique: true });
socialAffinitySchema.index({ guildId: 1, user1Id: 1 });
socialAffinitySchema.index({ guildId: 1, user2Id: 1 });

export const SocialAffinityModel = createMockModel('SocialAffinity', socialAffinitySchema);
