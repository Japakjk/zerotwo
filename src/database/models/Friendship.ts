import { Schema } from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IFriendship {
  guildId: string;
  user1Id: string;
  user2Id: string;
  status: 'pending' | 'accepted';
  isBestFriend: boolean;
  createdAt: Date;
}

const friendshipSchema = new Schema<IFriendship>({
  guildId: { type: String, required: true },
  user1Id: { type: String, required: true },
  user2Id: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  isBestFriend: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

friendshipSchema.index({ guildId: 1, user1Id: 1 });
friendshipSchema.index({ guildId: 1, user2Id: 1 });

export const FriendshipModel = createMockModel('Friendship', friendshipSchema);
