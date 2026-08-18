import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Message } from 'discord.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('case')
    .setDescription('Mostra detalhes de um caso de moderação específico.')
    .addIntegerOption(opt => opt.setName('id').setDescription('O número do caso').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const caseId = interaction.options.getInteger('id', true);
    const modCase = await ModerationService.getCaseById(interaction.guild!.id, caseId);

    if (!modCase) {
      return interaction.editReply({ content: `${Emojis.warning} Caso **#${caseId}** não encontrado no Garden!` });
    }

    const target = await interaction.client.users.fetch(modCase.userId).catch(() => ({ tag: 'Desconhecido', id: modCase.userId }));
    const moderator = await interaction.client.users.fetch(modCase.moderatorId).catch(() => ({ tag: 'Desconhecido', id: modCase.moderatorId }));

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.case} Detalhes do Caso #${modCase.caseId}`)
      .setColor('#ff3b69')
      .addFields(
        { name: '👤 Usuário', value: `${(target as any).tag} (${modCase.userId})`, inline: true },
        { name: '🛡️ Moderador', value: `${(moderator as any).tag} (${modCase.moderatorId})`, inline: true },
        { name: '🛠️ Ação', value: modCase.action.toUpperCase(), inline: true },
        { name: '📄 Motivo', value: modCase.reason },
        { name: '📅 Data', value: modCase.timestamp.toLocaleString('pt-BR'), inline: true }
      );

    if (modCase.duration) {
      embed.addFields({ name: '⏳ Duração', value: modCase.duration, inline: true });
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) return;

    const caseId = parseInt(args[0]);
    if (isNaN(caseId)) return message.reply({ content: 'Forneça um ID de caso válido!' });

    const modCase = await ModerationService.getCaseById(message.guild!.id, caseId);
    if (!modCase) return message.reply({ content: 'Caso não encontrado.' });

    await message.reply({ content: `**Caso #${modCase.caseId}** | **${modCase.action.toUpperCase()}**\nUsuário: <@${modCase.userId}>\nMotivo: ${modCase.reason}` });
  }
};
