import { TextChannel, EmbedBuilder, Guild } from 'discord.js';
import { GuildModel } from '../../database/models/Guild.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export class LoggingService {
  static async sendLog(guild: Guild, type: 'moderation' | 'messages' | 'members' | 'voice', embed: EmbedBuilder) {
    const guildData = await GuildModel.findOne({ guildId: guild.id });
    if (!guildData || !guildData.logChannels) return;

    const channelId = guildData.logChannels[type];
    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId) as TextChannel;
    if (channel) {
      try {
        await channel.send({ embeds: [embed] });
      } catch (err) {
        console.error(`[LoggingService] Erro ao enviar log para ${channelId}:`, err);
      }
    }
  }

  static async logModeration(guild: Guild, caseData: any, target: any, moderator: any) {
    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.case} Case #${caseData.caseId} | ${caseData.action.toUpperCase()}`)
      .setColor('#ff3b69')
      .addFields(
        { name: '👤 Usuário', value: `${target.tag} (${target.id})`, inline: true },
        { name: '🛡️ Moderador', value: `${moderator.tag} (${moderator.id})`, inline: true },
        { name: '📄 Motivo', value: caseData.reason }
      );

    if (caseData.duration) {
      embed.addFields({ name: '⏳ Duração', value: caseData.duration, inline: true });
    }

    await this.sendLog(guild, 'moderation', embed);
  }

  static async logMessageDelete(message: any) {
    if (!message.guild || message.author?.bot) return;
    const embed = new ZeroTwoEmbed()
      .setTitle('🗑️ Mensagem Apagada')
      .addFields(
        { name: 'Autor', value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: 'Canal', value: `${message.channel}`, inline: true },
        { name: 'Conteúdo', value: message.content || '*Sem conteúdo (anexo ou embed)*' }
      );
    await this.sendLog(message.guild, 'messages', embed);
  }

  static async logMemberJoin(member: any) {
    const embed = new ZeroTwoEmbed()
      .setTitle('📥 Novo Darling no Garden')
      .setDescription(`Seja bem-vindo(a), **${member.user.username}**! Agora somos **${member.guild.memberCount}** pistoqueiros.`)
      .setThumbnail(member.user.displayAvatarURL());
    await this.sendLog(member.guild, 'members', embed);
  }

  static async logMemberLeave(member: any) {
    const embed = new ZeroTwoEmbed()
      .setTitle('📤 Um Darling deixou o Garden')
      .setDescription(`**${member.user.username}** saiu do servidor. Agora somos **${member.guild.memberCount}** pistoqueiros.`)
      .setThumbnail(member.user.displayAvatarURL());
    await this.sendLog(member.guild, 'members', embed);
  }

  static async logMessageUpdate(oldMessage: any, newMessage: any) {
    if (!oldMessage.guild || oldMessage.author?.bot || oldMessage.content === newMessage.content) return;
    const embed = new ZeroTwoEmbed()
      .setTitle('📝 Mensagem Editada')
      .addFields(
        { name: 'Autor', value: `${oldMessage.author.tag} (${oldMessage.author.id})`, inline: true },
        { name: 'Canal', value: `${oldMessage.channel}`, inline: true },
        { name: 'Antes', value: oldMessage.content || '*Sem conteúdo*' },
        { name: 'Depois', value: newMessage.content || '*Sem conteúdo*' }
      );
    await this.sendLog(oldMessage.guild, 'messages', embed);
  }
}
