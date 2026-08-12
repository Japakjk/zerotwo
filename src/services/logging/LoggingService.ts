import { TextChannel, EmbedBuilder, Guild } from 'discord.js';
import { GuildModel } from '../../database/models/Guild.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export class LoggingService {
  static async log(guild: Guild, embed: EmbedBuilder) {
    const guildData = await GuildModel.findOne({ guildId: guild.id });
    if (!guildData || !guildData.welcomeChannelId) return; // Reusing welcome channel or add logChannelId to model

    const channel = guild.channels.cache.get(guildData.welcomeChannelId) as TextChannel;
    if (channel) {
      await channel.send({ embeds: [embed] });
    }
  }

  static async logMessageDelete(message: any) {
    if (!message.guild || message.author?.bot) return;
    const embed = new ZeroTwoEmbed()
      .setTitle('🗑️ Mensagem Apagada')
      .setColor('#ff3b69')
      .addFields(
        { name: 'Autor', value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: 'Canal', value: `${message.channel}`, inline: true },
        { name: 'Conteúdo', value: message.content || '*Sem conteúdo (anexo ou embed)*' }
      );
    await this.log(message.guild, embed);
  }

  static async logMemberJoin(member: any) {
    const embed = new ZeroTwoEmbed()
      .setTitle('📥 Novo Darling no Garden')
      .setDescription(`Seja bem-vindo(a), **${member.user.username}**! Agora somos **${member.guild.memberCount}** pistoqueiros.`)
      .setThumbnail(member.user.displayAvatarURL());
    await this.log(member.guild, embed);
  }
}
