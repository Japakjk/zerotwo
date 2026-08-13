import { Message, PermissionFlagsBits, TextChannel } from 'discord.js';
import { GuildModel } from '../../database/models/Guild.js';
import { ModerationService } from '../moderation/ModerationService.js';
import { Emojis } from '../../utils/emojis.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export class AutoModService {
  private static inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/i;
  private static linkRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  private static userMessages = new Map<string, { content: string, count: number, timestamp: number }>();

  static async checkMessage(message: Message): Promise<boolean> {
    if (!message.guild || message.author.bot) return false;
    
    // Moderadores e Administradores são imunes
    if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return false;

    const guildData = await GuildModel.findOne({ guildId: message.guild.id });
    if (!guildData || !guildData.automod || !guildData.automod.enabled) return false;

    const { automod } = guildData;

    // 1. Anti-Invite
    if (automod.antiInvites && this.inviteRegex.test(message.content)) {
      return await this.punish(message, 'Convite de Servidor', 'antiInvites');
    }

    // 2. Anti-Links (Links maliciosos ou gerais)
    if (automod.antiLinks && this.linkRegex.test(message.content)) {
      return await this.punish(message, 'Envio de Links', 'antiLinks');
    }

    // 3. Anti-Spam
    if (automod.antiSpam) {
      const isSpamming = await this.checkSpam(message);
      if (isSpamming) {
        return await this.punish(message, 'Spam de Mensagens', 'antiSpam');
      }
    }

    return false;
  }

  private static async checkSpam(message: Message): Promise<boolean> {
    const key = `${message.author.id}-${message.guild!.id}`;
    const now = Date.now();
    const data = this.userMessages.get(key);

    if (data) {
      // Se a mensagem for igual e enviada em menos de 3 segundos
      if (data.content === message.content && now - data.timestamp < 3000) {
        data.count++;
        data.timestamp = now;
        this.userMessages.set(key, data);
        
        if (data.count >= 3) {
          this.userMessages.delete(key);
          return true;
        }
      } else {
        this.userMessages.set(key, { content: message.content, count: 1, timestamp: now });
      }
    } else {
      this.userMessages.set(key, { content: message.content, count: 1, timestamp: now });
    }

    // Limpeza periódica do Map para não estourar memória
    setTimeout(() => this.userMessages.delete(key), 10000);
    return false;
  }

  private static async punish(message: Message, reason: string, type: string): Promise<boolean> {
    try {
      await message.delete().catch(() => {});
      
      // Aplica um aviso automático no banco de dados
      await ModerationService.createCase(
        message.guild!,
        message.author.id,
        message.client.user!.id,
        'warn',
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
      console.error('[AutoModService] Erro ao punir:', err);
      return false;
    }
  }
}
