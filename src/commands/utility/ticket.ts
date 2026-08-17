import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, MessageFlags } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Envia o painel de atendimento de tickets da Zero Two.')
    .addChannelOption(opt => opt.setName('canal').setDescription('Canal onde o painel será enviado').addChannelTypes(ChannelType.GuildText).setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const channel = (interaction.options.getChannel('canal') || interaction.channel) as any;
    await this.sendPanel(interaction, channel, true);
  },

  async executeText(message: any, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply(`${Emojis.ban} Apenas administradores podem enviar o painel de tickets!`);
    }
    const channel = message.mentions.channels.first() || message.channel;
    await this.sendPanel(message, channel, false);
  },

  async sendPanel(context: any, channel: any, isInteraction: boolean) {
    const embed = new ZeroTwoEmbed()
      .setTitle('🎫 Central de Atendimento — Garden')
      .setDescription(`${Emojis.seta} Precisa de ajuda, deseja comprar um **VIP** ou falar com a staff da **Zero Two**?\n\nClique no botão abaixo para abrir o seu ticket privado e nossa equipe irá atendê-lo o mais rápido possível! 🦖❤️`)
      .setImage('https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpjcHRjZnhwMWw2Z3F5MWZ6M3J4MW5qeG94NHJ4OW9qeHg4OW1wayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9oyx89v84D0Y/giphy.gif')
      .setFooter({ text: 'Sistema de Atendimento Oficial — Darling in the Franxx' });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket_main')
        .setLabel('Abrir Ticket')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎫'),
      new ButtonBuilder()
        .setCustomId('open_ticket_vip')
        .setLabel('Adquirir VIP')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⭐')
    );

    await channel.send({ embeds: [embed], components: [row] });

    const msg = `${Emojis.check} Painel de tickets enviado com sucesso para ${channel}!`;
    if (isInteraction) await context.editReply({ content: msg });
    else await context.reply({ content: msg });
  },
};
