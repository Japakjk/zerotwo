import { 
  TextChannel, 
  PermissionFlagsBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType,
  Collection,
  Message
} from 'discord.js';
import { TicketModel } from '../../database/models/Ticket.js';
import { GuildModel } from '../../database/models/Guild.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { logger } from '../../utils/logger.js';

export class TicketService {
  static async createTicket(member: any, type: 'support' | 'vip') {
    const guild = member.guild;
    const guildDb = await GuildModel.findOne({ guildId: guild.id });
    
    if (!guildDb?.tickets?.enabled) {
      throw new Error('O sistema de tickets está desativado neste servidor, Darling!');
    }

    // Prevenção de múltiplos tickets
    const existingTicket = await TicketModel.findOne({ 
      guildId: guild.id, 
      userId: member.id, 
      status: 'open' 
    });

    if (existingTicket) {
      throw new Error(`Você já possui um ticket aberto em <#${existingTicket.channelId}>, Darling!`);
    }

    const categoryId = guildDb.tickets.categoryId;
    const supportRoleId = guildDb.tickets.supportRoleId;

    const channel = await guild.channels.create({
      name: `ticket-${type}-${member.user.username}`,
      type: ChannelType.GuildText,
      parent: categoryId || null,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory],
        },
        ...(supportRoleId ? [{
          id: supportRoleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory],
        }] : []),
      ],
    });

    await TicketModel.create({
      guildId: guild.id,
      userId: member.id,
      channelId: channel.id,
      type: type,
      status: 'open'
    });

    const welcomeEmbed = new ZeroTwoEmbed()
      .setTitle(`🎫 Ticket de ${type === 'vip' ? 'Compra VIP' : 'Suporte'} — ${member.user.username}`)
      .setDescription(
        `Olá <@${member.id}>! Bem-vindo ao seu ticket.\n\n` +
        `${Emojis.seta} Por favor, descreva sua dúvida ou o plano VIP que deseja adquirir.\n` +
        `${Emojis.seta} Nossa equipe de suporte será notificada e virá te atender em breve.\n\n` +
        `*Para fechar este ticket, clique no botão abaixo.*`
      )
      .setThumbnail(member.user.displayAvatarURL());

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Fechar Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
    );

    await channel.send({ content: `<@${member.id}> ${supportRoleId ? `| <@&${supportRoleId}>` : ''}`, embeds: [welcomeEmbed], components: [row] });

    return channel;
  }

  static async closeTicket(channel: TextChannel, moderatorId: string): Promise<{ closed: boolean; reason?: string }> {
    const ticket = await TicketModel.findOne({ channelId: channel.id, status: 'open' });
    if (!ticket) return { closed: false, reason: 'Este canal não possui um ticket aberto ou ele já foi encerrado.' };

    const guildDb = await GuildModel.findOne({ guildId: channel.guild.id });
    const member = await channel.guild.members.fetch(moderatorId).catch(() => null);
    const isTicketOwner = ticket.userId === moderatorId;
    const isAdministrator = member?.permissions.has(PermissionFlagsBits.Administrator) ?? false;
    const isSupport = Boolean(guildDb?.tickets?.supportRoleId && member?.roles.cache.has(guildDb.tickets.supportRoleId));

    if (!isTicketOwner && !isAdministrator && !isSupport) {
      return { closed: false, reason: 'Apenas o autor do ticket, a equipe de suporte ou um administrador pode fechá-lo.' };
    }

    // Gerar Transcript simples
    const messages = await channel.messages.fetch({ limit: 100 });
    const transcript = Array.from(messages.values())
      .reverse()
      .map(m => `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`)
      .join('\n');

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    ticket.closedBy = moderatorId;
    await ticket.save();

    // Logar no canal de logs se existir
    const logChannelId = guildDb?.logChannels?.moderation;
    
    if (logChannelId) {
      const logChannel = channel.guild.channels.cache.get(logChannelId) as TextChannel;
      if (logChannel) {
        const logEmbed = new ZeroTwoEmbed()
          .setTitle('🔒 Ticket Encerrado')
          .addFields(
            { name: 'Canal', value: `#${channel.name}`, inline: true },
            { name: 'Autor', value: `<@${ticket.userId}>`, inline: true },
            { name: 'Fechado por', value: `<@${moderatorId}>`, inline: true },
            { name: 'Tipo', value: ticket.type.toUpperCase(), inline: true }
          );
        
        // Enviar transcript como arquivo
        const buffer = Buffer.from(transcript, 'utf-8');
        await logChannel.send({ embeds: [logEmbed], files: [{ attachment: buffer, name: `transcript-${channel.name}.txt` }] });
      }
    }

    await channel.send(`${Emojis.loading} Este ticket será excluído em 5 segundos...`);
    setTimeout(() => channel.delete().catch(() => {}), 5000);
    return { closed: true };
  }
}
