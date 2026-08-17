import { Message, PermissionFlagsBits, TextChannel, GuildMember, EmbedBuilder } from 'discord.js';
import { GuildModel } from '../../database/models/Guild.js';
import { ModerationService } from '../moderation/ModerationService.js';
import { Emojis } from '../../utils/emojis.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';

export class AutoModService {
  private static inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/i;
  private static linkRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  
  // Cache em memória para detecção de spam/flood
  private static userMessages = new Map<string, { content: string, count: number, lastTimestamp: number, timestamps: number[] }>();
  
  // Cache para Anti-Raid
  private static guildJoins = new Map<string, number[]>();

  static async checkMessage(message: Message): Promise<boolean> {
    if (!message.guild || message.author.bot) return false;
    
    // Imunidade para administradores e moderadores
    if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return false;

    const guildData = await GuildModel.findOne({ guildId: message.guild.id });
    if (!guildData || !guildData.automod || !guildData.automod.enabled) return false;

    const { automod } = guildData;

    // 1. Anti-Invite
    if (automod.antiInvites && this.inviteRegex.test(message.content)) {
      return await this.punish(message, 'Divulgação de Convites', 'antiInvites');
    }

    // 2. Anti-Links
    if (automod.antiLinks && this.linkRegex.test(message.content)) {
      return await this.punish(message, 'Envio de Links', 'antiLinks');
    }

    // 3. Anti-Mentions
    if (automod.antiMentions > 0 && message.mentions.users.size > automod.antiMentions) {
      return await this.punish(message, 'Excesso de Menções', 'antiMentions');
    }

    // 4. Anti-Flood & Anti-Spam
    const key = `${message.author.id}-${message.guild.id}`;
    const now = Date.now();
    const data = this.userMessages.get(key) || { content: '', count: 0, lastTimestamp: 0, timestamps: [] };

    // Anti-Flood (Mensagens idênticas)
    if (automod.maxRepeated > 0) {
      if (data.content === message.content && now - data.lastTimestamp < 5000) {
        data.count++;
      } else {
        data.content = message.content;
        data.count = 1;
      }
      
      if (data.count > automod.maxRepeated) {
        this.userMessages.delete(key);
        return await this.punish(message, 'Mensagens Repetidas (Flood)', 'maxRepeated');
      }
    }

    // Anti-Spam (Muitas mensagens em pouco tempo)
    if (automod.antiSpam) {
      data.timestamps.push(now);
      // Mantém apenas os últimos 5 segundos
      data.timestamps = data.timestamps.filter(t => now - t < 5000);
      
      if (data.timestamps.length > 5) { // Limite fixo de 5 msgs / 5 segs
        this.userMessages.delete(key);
        return await this.punish(message, 'Spam de Mensagens', 'antiSpam');
      }
    }

    data.lastTimestamp = now;
    this.userMessages.set(key, data);

    // Limpeza de cache a cada 30 segundos
    setTimeout(() => {
      const current = this.userMessages.get(key);
      if (current && Date.now() - current.lastTimestamp > 30000) {
        this.userMessages.delete(key);
      }
    }, 30000);

    return false;
  }

  static async checkJoin(member: GuildMember): Promise<void> {
    const guildData = await GuildModel.findOne({ guildId: member.guild.id });
    if (!guildData || !guildData.antiraid || !guildData.antiraid.enabled) return;

    const { antiraid } = guildData;
    const now = Date.now();

    // 1. Verificação de Idade da Conta
    if (antiraid.accountAge > 0) {
      const accountAgeDays = (now - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
      if (accountAgeDays < antiraid.accountAge) {
        try {
          await member.send(`${Emojis.warning} Sua conta é muito recente para entrar no Garden! Requisito: ${antiraid.accountAge} dias.`).catch(() => {});
          await member.kick('Anti-Raid: Conta muito recente.');
          logger.info(`[Anti-Raid] Membro ${member.user.tag} expulso (Conta com ${Math.floor(accountAgeDays)} dias)`);
          return;
        } catch (err) {
          logger.error('[Anti-Raid] Erro ao expulsar conta recente:', err);
        }
      }
    }

    // 2. Detecção de Mass Join (Raid)
    if (antiraid.massJoinLimit > 0) {
      const joins = this.guildJoins.get(member.guild.id) || [];
      joins.push(now);
      
      const recentJoins = joins.filter(t => now - t < antiraid.massJoinTime * 1000);
      this.guildJoins.set(member.guild.id, recentJoins);

      if (recentJoins.length > antiraid.massJoinLimit) {
        logger.warn(`[Anti-Raid] Raid detectada em ${member.guild.name}! (${recentJoins.length} entradas em ${antiraid.massJoinTime}s)`);
        
        // Notifica no canal de logs se existir
        const logChannelId = (guildData.logChannels as any).moderation;
        if (logChannelId) {
          const channel = member.guild.channels.cache.get(logChannelId) as TextChannel;
          if (channel) {
            const embed = new ZeroTwoEmbed()
              .setTitle(`${Emojis.warning} ALERTA DE RAID DETECTADO`)
              .setDescription(`Entrada massiva de usuários detectada!\n\n${Emojis.seta} **Entradas:** ${recentJoins.length}\n${Emojis.seta} **Tempo:** ${antiraid.massJoinTime}s`)
              .setColor('#ff0000');
            channel.send({ embeds: [embed] });
          }
        }
      }
    }
  }

  private static async punish(message: Message, reason: string, type: string): Promise<boolean> {
    try {
      await message.delete().catch(() => {});
      
      // Aplica um aviso automático no banco de dados via ModerationService
      await ModerationService.warn(
        message.member!,
        message.client.user!.id,
        `[AutoMod] ${reason}`
      );

      const embed = new ZeroTwoEmbed()
        .setTitle(`${Emojis.warning} AutoMod Ativado`)
        .setDescription(`Darling **${message.author.username}**, sua mensagem foi removida.\n\n${Emojis.seta} **Motivo:** ${reason}\n${Emojis.seta_menor} Cuidado, avisos automáticos podem levar a punições severas!`)
        .setColor('#ff3b69');

      if (message.channel instanceof TextChannel) {
        const warningMsg = await message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
        setTimeout(() => warningMsg.delete().catch(() => {}), 7000);
      }

      return true;
    } catch (err) {
      logger.error('[AutoModService] Erro ao punir:', err);
      return false;
    }
  }
}
