import { ModerationCaseModel } from '../../database/models/ModerationCase.js';
import { LoggingService } from '../logging/LoggingService.js';
import { Guild } from 'discord.js';

export class ModerationService {
  static async createCase(guild: Guild, userId: string, moderatorId: string, action: string, reason: string, duration?: string) {
    const guildId = guild.id;
    const lastCase = await ModerationCaseModel.findOne({ guildId }).sort({ caseId: -1 });
    const caseId = lastCase ? lastCase.caseId + 1 : 1;

    const modCase = await ModerationCaseModel.create({
      caseId,
      guildId,
      userId,
      moderatorId,
      action: action as any,
      reason,
      duration,
    });

    // Tenta buscar os usuários no cache do Discord para o log
    try {
      const target = await guild.client.users.fetch(userId);
      const moderator = await guild.client.users.fetch(moderatorId);
      await LoggingService.logModeration(guild, modCase, target, moderator);
    } catch (err) {
      console.error('[ModerationService] Erro ao enviar log:', err);
    }

    return modCase;
  }

  static async getCases(guildId: string, userId: string) {
    return await ModerationCaseModel.find({ guildId, userId }).sort({ timestamp: -1 });
  }
}
