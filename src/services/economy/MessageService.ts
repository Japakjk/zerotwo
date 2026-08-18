import { UserModel } from '../../database/models/User.js';

export const MESSAGE_REWARDS = [
  { count: 250, coins: 1750000, vipDays: 1 },
  { count: 500, coins: 3500000, vipDays: 2 },
  { count: 750, coins: 5250000, vipDays: 2 },
  { count: 1000, coins: 7500000, vipDays: 3 },
  { count: 1500, coins: 10000000, vipDays: 5 },
];

export class MessageService {
  static async recordMessage(userId: string, guildId: string, userDoc?: any) {
    let user = userDoc || await UserModel.findOne({ userId, guildId });
    if (!user) {
      user = await UserModel.create({
        userId,
        guildId,
        coins: 1000000,
        bank: 0,
        messagesToday: 0,
        messagesWeek: 0,
        messagesMonth: 0,
        messagesTotal: 0,
        claimedMilestones: []
      });
    }

    user.messagesToday = (user.messagesToday || 0) + 1;
    user.messagesWeek = (user.messagesWeek || 0) + 1;
    user.messagesMonth = (user.messagesMonth || 0) + 1;
    user.messagesTotal = (user.messagesTotal || 0) + 1;

    if (!userDoc) await user.save();
    return user;
  }

  static async getStats(userId: string, guildId: string) {
    let user = await UserModel.findOne({ userId, guildId });
    if (!user) {
      user = {
        messagesToday: 0,
        messagesWeek: 0,
        messagesMonth: 0,
        messagesTotal: 0,
        claimedMilestones: []
      };
    }
    return user;
  }
}
