import { BlacklistModel } from '../../database/models/Blacklist.js';
import { RateLimitService } from '../core/RateLimitService.js';

export interface SecurityDecision {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
}

export class SecurityService {
  static async canUseCommand(userId: string, guildId: string, commandName: string): Promise<SecurityDecision> {
    const isBlacklisted = await BlacklistModel.findOne({ userId });
    if (isBlacklisted) {
      return { allowed: false, reason: 'Usuário em blacklist.' };
    }

    const rateLimitKey = `command:${guildId}:${userId}:${commandName}`;
    const result = RateLimitService.consume(rateLimitKey, 10, 60000);
    if (!result.allowed) {
      return {
        allowed: false,
        reason: 'Muitas tentativas em pouco tempo.',
        retryAfterMs: result.retryAfterMs,
      };
    }

    return { allowed: true };
  }

  static async setBlacklist(userId: string, reason: string): Promise<void> {
    await BlacklistModel.findOneAndUpdate(
      { userId },
      { $set: { userId, reason, createdAt: new Date() } },
      { upsert: true, new: true }
    );
  }

  static async clearBlacklist(userId: string): Promise<void> {
    await BlacklistModel.deleteOne({ userId });
  }
}
