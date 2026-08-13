import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Message } from 'discord.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Remove o banimento de um usuário.')
    .addStringOption(opt => opt.setName('id').setDescription('ID do usuário a ser desbanido').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('O motivo').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const targetId = interaction.options.getString('id', true);
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido.';

    try {
      await interaction.guild?.members.unban(targetId, reason);
      const modCase = await ModerationService.createCase(interaction.guild!, targetId, interaction.user.id, 'unban', reason);

      const embed = ZeroTwoEmbed.success('Usuário Desbanido', `O ID **${targetId}** foi perdoado e pode voltar ao Garden.`)
        .addFields(
          { name: '📄 Motivo', value: reason },
          { name: '🆔 Caso', value: `#${modCase.caseId}`, inline: true }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({ content: 'Não encontrei esse banimento ou o ID é inválido, Darling!' });
    }
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) return;

    const targetId = args[0];
    if (!targetId) return message.reply({ content: 'Forneça o ID do usuário para desbanir!' });

    try {
      await message.guild?.members.unban(targetId);
      await message.reply({ content: `${Emojis.check} Usuário **${targetId}** desbanido com sucesso!` });
    } catch (err) {
      await message.reply({ content: 'Erro ao desbanir usuário. Verifique o ID.' });
    }
  }
};
