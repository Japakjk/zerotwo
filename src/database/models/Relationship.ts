import { Schema } from 'mongoose';
import { createMockModel } from './MockModel.js';

export type RelationshipType = 'ficando' | 'namorando' | 'noivos' | 'casados';

export interface IRelationship {
  guildId: string;
  user1Id: string;
  user2Id: string;
  type: RelationshipType;
  startedAt: Date;
  status: 'pending' | 'active';
  affinity: number;
}

const relationshipSchema = new Schema<IRelationship>({
  guildId: { type: String, required: true },
  user1Id: { type: String, required: true },
  user2Id: { type: String, required: true },
  type: { type: String, enum: ['ficando', 'namorando', 'noivos', 'casados'], default: 'namorando' },
  startedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'active'], default: 'pending' },
  affinity: { type: Number, default: 0 },
});

relationshipSchema.index({ guildId: 1, user1Id: 1 });
relationshipSchema.index({ guildId: 1, user2Id: 1 });

export const RelationshipModel = createMockModel('Relationship', relationshipSchema);
