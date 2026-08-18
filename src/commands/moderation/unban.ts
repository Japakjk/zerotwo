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
      const modCase = await ModerationService.unban(interaction.guild!, targetId, interaction.user.id, reason);

      const embed = ZeroTwoEmbed.success('Usuário Desbanido', `O ID **${targetId}** foi perdoado e pode voltar ao Garden.`)
        .addFields(
          { name: '📄 Motivo', value: reason },
          { name: '🆔 Caso', value: `#${modCase.caseId}`, inline: true }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[unban] falha ao remover banimento', { guildId: interaction.guildId, targetId, moderatorId: interaction.user.id, error });
      await interaction.editReply({ embeds: [ZeroTwoEmbed.error('Desbanimento não concluído', 'Não encontrei um banimento ativo para este ID ou o Discord recusou a alteração. Confirme o ID e `BanMembers`.') ] });
    }
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply({ embeds: [ZeroTwoEmbed.permissionError('BanMembers')] });
    }

    const targetId = args[0];
    if (!targetId) return message.reply({ content: 'Forneça o ID do usuário para desbanir!' });

    try {
      const modCase = await ModerationService.unban(message.guild!, targetId, message.author.id, 'Comando de texto');
      await message.reply({ content: `${Emojis.check} Usuário **${targetId}** desbanido com sucesso! (Caso #${modCase.caseId})` });
    } catch (error) {
      console.error('[unban] falha ao remover banimento por prefixo', { guildId: message.guildId, targetId, moderatorId: message.author.id, error });
      await message.reply({ embeds: [ZeroTwoEmbed.error('Desbanimento não concluído', 'Não encontrei um banimento ativo para este ID ou o Discord recusou a alteração. Confirme o ID e `BanMembers`.') ] });
    }
  }
};
