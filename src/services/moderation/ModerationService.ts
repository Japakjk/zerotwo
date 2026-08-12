import { ModerationCaseModel } from '../../database/models/ModerationCase.js';

export class ModerationService {
  static async createCase(guildId: string, userId: string, moderatorId: string, action: string, reason: string, duration?: string) {
    const lastCase = await ModerationCaseModel.findOne({ guildId }).sort({ caseId: -1 });
    const caseId = lastCase ? lastCase.caseId + 1 : 1;

    return await ModerationCaseModel.create({
      caseId,
      guildId,
      userId,
      moderatorId,
      action,
      reason,
      duration,
    });
  }

  static async getCases(guildId: string, userId: string) {
    return await ModerationCaseModel.find({ guildId, userId }).sort({ timestamp: -1 });
  }
}
