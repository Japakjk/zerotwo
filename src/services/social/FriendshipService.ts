import { FriendshipModel, IFriendship } from '../../database/models/Friendship.js';

export class FriendshipService {
  static async getFriends(userId: string, guildId: string): Promise<IFriendship[]> {
    return await FriendshipModel.find({
      guildId,
      $or: [{ user1Id: userId }, { user2Id: userId }],
      status: 'accepted'
    });
  }

  static async sendRequest(fromId: string, toId: string, guildId: string): Promise<{ success: boolean; message: string }> {
    if (fromId === toId) return { success: false, message: 'Você não pode ser seu próprio amigo, Darling!' };

    const existing = await FriendshipModel.findOne({
      guildId,
      $or: [
        { user1Id: fromId, user2Id: toId },
        { user1Id: toId, user2Id: fromId }
      ]
    });

    if (existing) {
      if (existing.status === 'accepted') return { success: false, message: 'Vocês já são amigos!' };
      return { success: false, message: 'Já existe um pedido pendente entre vocês.' };
    }

    await FriendshipModel.create({
      guildId,
      user1Id: fromId,
      user2Id: toId,
      status: 'pending'
    });

    return { success: true, message: 'Pedido de amizade enviado!' };
  }

  static async acceptRequest(userId: string, fromId: string, guildId: string): Promise<boolean> {
    const request = await FriendshipModel.findOne({
      guildId,
      user1Id: fromId,
      user2Id: userId,
      status: 'pending'
    });

    if (!request) return false;

    request.status = 'accepted';
    await request.save();
    return true;
  }

  static async removeFriend(userId: string, friendId: string, guildId: string): Promise<boolean> {
    const result = await FriendshipModel.deleteOne({
      guildId,
      $or: [
        { user1Id: userId, user2Id: friendId },
        { user1Id: friendId, user2Id: userId }
      ]
    });

    return result.deletedCount > 0;
  }
}
