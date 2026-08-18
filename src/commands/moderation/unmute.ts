import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Message } from 'discord.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove o silenciamento de um membro.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O membro a ser desmutado').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('O motivo').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido.';
    const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.editReply({ content: 'Membro não encontrado, Darling!' });

    try {
      const modCase = await ModerationService.untimeout(member, interaction.user.id, reason);

      const embed = ZeroTwoEmbed.success('Silenciamento Removido', `**${target.tag}** agora pode falar novamente no Garden!`)
        .addFields(
          { name: '📄 Motivo', value: reason },
          { name: '🆔 Caso', value: `#${modCase.caseId}`, inline: true }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[unmute] falha ao remover timeout', { guildId: interaction.guildId, userId: target.id, moderatorId: interaction.user.id, error });
      await interaction.editReply({ embeds: [ZeroTwoEmbed.error('Silenciamento não removido', 'O Discord recusou a alteração. Verifique `ModerateMembers` e a hierarquia de cargos.') ] });
    }
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply({ embeds: [ZeroTwoEmbed.permissionError('ModerateMembers')] });
    }

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: 'Mencione um Darling para desmutar!' });

    const member = await message.guild?.members.fetch(target.id).catch(() => null);
    if (!member) return message.reply({ content: 'Membro não encontrado.' });

    try {
      const modCase = await ModerationService.untimeout(member, message.author.id, 'Comando de texto');
      await message.reply({ content: `${Emojis.check} Silenciamento de **${target.tag}** removido! (Caso #${modCase.caseId})` });
    } catch (error) {
      console.error('[unmute] falha ao remover timeout por prefixo', { guildId: message.guildId, userId: target.id, moderatorId: message.author.id, error });
      await message.reply({ embeds: [ZeroTwoEmbed.error('Silenciamento não removido', 'O Discord recusou a alteração. Verifique `ModerateMembers` e a hierarquia de cargos.') ] });
    }
  }
};
