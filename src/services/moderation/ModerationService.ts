import { ModerationCaseModel } from '../../database/models/ModerationCase.js';
import { LoggingService } from '../logging/LoggingService.js';
import { Guild, GuildMember, TextChannel, PermissionFlagsBits } from 'discord.js';

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
      const target = await guild.client.users.fetch(userId).catch(() => null);
      const moderator = await guild.client.users.fetch(moderatorId).catch(() => null);
      if (target && moderator) {
        await LoggingService.logModeration(guild, modCase, target, moderator);
      }
    } catch (err) {
      console.error('[ModerationService] Erro ao enviar log:', err);
    }

    return modCase;
  }

  static async warn(member: GuildMember, moderatorId: string, reason: string) {
    return await this.createCase(member.guild, member.id, moderatorId, 'warn', reason);
  }

  static async kick(member: GuildMember, moderatorId: string, reason: string) {
    await member.kick(reason);
    return await this.createCase(member.guild, member.id, moderatorId, 'kick', reason);
  }

  static async ban(guild: Guild, userId: string, moderatorId: string, reason: string, deleteMessageDays = 0) {
    const botMember = guild.members.me ?? await guild.members.fetchMe().catch(() => null);
    if (!botMember?.permissions.has(PermissionFlagsBits.BanMembers)) {
      throw new Error('BOT_MISSING_BAN_MEMBERS');
    }

    const moderator = await guild.members.fetch(moderatorId).catch(() => null);
    if (!moderator?.permissions.has(PermissionFlagsBits.BanMembers)) {
      throw new Error('MODERATOR_MISSING_BAN_MEMBERS');
    }

    if (userId === guild.client.user?.id) {
      throw new Error('CANNOT_BAN_BOT');
    }
    if (userId === moderatorId) {
      throw new Error('CANNOT_BAN_SELF');
    }

    const targetMember = await guild.members.fetch(userId).catch(() => null);
    if (targetMember && !targetMember.bannable) {
      throw new Error('TARGET_NOT_BANNABLE');
    }

    const existingBan = await guild.bans.fetch(userId).catch((error: any) => {
      if (error?.code === 10026) return null;
      throw error;
    });
    if (existingBan) {
      throw new Error('ALREADY_BANNED');
    }

    await guild.members.ban(userId, { reason, deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60 });
    return await this.createCase(guild, userId, moderatorId, 'ban', reason);
  }

  static async unban(guild: Guild, userId: string, moderatorId: string, reason: string) {
    await guild.members.unban(userId, reason);
    return await this.createCase(guild, userId, moderatorId, 'unban', reason);
  }

  static async timeout(member: GuildMember, moderatorId: string, durationMs: number, reason: string) {
    await member.timeout(durationMs, reason);
    const durationStr = `${Math.floor(durationMs / 60000)} minutos`;
    return await this.createCase(member.guild, member.id, moderatorId, 'timeout', reason, durationStr);
  }

  static async untimeout(member: GuildMember, moderatorId: string, reason: string) {
    await member.timeout(null, reason);
    return await this.createCase(member.guild, member.id, moderatorId, 'untimeout', reason);
  }

  static async lock(channel: TextChannel, moderatorId: string, reason: string) {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      SendMessages: false
    });
    return await this.createCase(channel.guild, 'channel', moderatorId, 'lock', reason);
  }

  static async unlock(channel: TextChannel, moderatorId: string, reason: string) {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      SendMessages: null
    });
    return await this.createCase(channel.guild, 'channel', moderatorId, 'unlock', reason);
  }

  static async getCases(guildId: string, userId: string) {
    return await ModerationCaseModel.find({ guildId, userId }).sort({ timestamp: -1 });
  }

  static async getCaseById(guildId: string, caseId: number) {
    return await ModerationCaseModel.findOne({ guildId, caseId });
  }
}
