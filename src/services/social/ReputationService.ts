import { UserModel } from '../../database/models/User.js';

export class ReputationService {
  static async giveRep(fromId: string, toId: string, guildId: string): Promise<{ success: boolean; message: string; nextAvailable?: number }> {
    if (fromId === toId) return { success: false, message: 'Você não pode dar reputação para si mesmo, Darling!' };

    const fromUser = await UserModel.findOne({ userId: fromId, guildId }) || await UserModel.create({ userId: fromId, guildId });
    const now = Date.now();
    const cooldown = 12 * 60 * 60 * 1000; // 12h

    if (fromUser.lastRep && now - fromUser.lastRep.getTime() < cooldown) {
      return { success: false, message: 'Você já deu reputação recentemente.', nextAvailable: fromUser.lastRep.getTime() + cooldown };
    }

    await UserModel.findOneAndUpdate(
      { userId: toId, guildId },
      { $inc: { reputation: 1 } },
      { upsert: true }
    );

    fromUser.lastRep = new Date();
    await fromUser.save();

    return { success: true, message: 'Reputação enviada com sucesso!' };
  }

  static async getTopRep(guildId: string, limit: number = 10) {
    return await UserModel.find({ guildId }).sort({ reputation: -1 }).limit(limit);
  }
}
