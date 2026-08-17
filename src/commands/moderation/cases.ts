import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Message, EmbedBuilder } from 'discord.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cases')
    .setDescription('Mostra o histórico de moderação de um usuário.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O Darling para consultar').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    const cases = await ModerationService.getCases(interaction.guild!.id, target.id);

    if (cases.length === 0) {
      return interaction.editReply({ content: `${Emojis.check} Este Darling está limpo! Nenhum caso registrado.` });
    }

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.case} Histórico de Moderação | ${target.username}`)
      .setDescription(`Encontrei **${cases.length}** registros para este usuário no Garden.`)
      .setColor('#ff3b69');

    // Mostra apenas os últimos 10 casos para não estourar o limite de campos
    const recentCases = cases.slice(0, 10);
    
    recentCases.forEach((c: any) => {
      const date = c.timestamp.toLocaleDateString('pt-BR');
      embed.addFields({
        name: `Case #${c.caseId} | ${c.action.toUpperCase()}`,
        value: `📅 **Data:** ${date}\n📄 **Motivo:** ${c.reason}${c.duration ? `\n⏳ **Duração:** ${c.duration}` : ''}`,
        inline: false
      });
    });

    if (cases.length > 10) {
      embed.setFooter({ text: `Mostrando os 10 casos mais recentes de um total de ${cases.length}.` });
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) return;

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: 'Mencione um Darling para ver o histórico!' });

    const cases = await ModerationService.getCases(message.guild!.id, target.id);
    if (cases.length === 0) return message.reply({ content: 'Nenhum caso encontrado para este usuário.' });

    const embed = new ZeroTwoEmbed()
      .setTitle(`Histórico de ${target.username}`)
      .setDescription(`Total de casos: **${cases.length}**`);

    cases.slice(0, 5).forEach((c: any) => {
      embed.addFields({
        name: `Case #${c.caseId} - ${c.action.toUpperCase()}`,
        value: `Motivo: ${c.reason} (${c.timestamp.toLocaleDateString('pt-BR')})`
      });
    });

    await message.reply({ embeds: [embed] });
  }
};
