import { UserModel, IUser } from '../../database/models/User.js';

export class ProfileService {
  static async getProfile(userId: string, guildId: string): Promise<IUser> {
    let user = await UserModel.findOne({ userId, guildId });
    if (!user) {
      user = await UserModel.create({ userId, guildId });
    }
    return user;
  }

  static async updateBio(userId: string, guildId: string, bio: string): Promise<void> {
    await UserModel.findOneAndUpdate(
      { userId, guildId },
      { bio },
      { upsert: true, new: true },
    );
  }

  static async updateTitle(userId: string, guildId: string, title: string): Promise<void> {
    await UserModel.findOneAndUpdate(
      { userId, guildId },
      { title },
      { upsert: true, new: true },
    );
  }
}
