import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bane um membro do servidor.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O membro a ser banido').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('O motivo do banimento').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario')!;
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido.';
    const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.editReply({ content: 'Eu não tenho poder suficiente para banir esse Darling!' });
    }

    try {
      await interaction.guild?.members.ban(target.id, { reason });
      const modCase = await ModerationService.createCase(interaction.guildId!, target.id, interaction.user.id, 'ban', reason);

      const embed = ZeroTwoEmbed.success('Membro Banido', `O usuário **${target.tag}** foi removido permanentemente.`)
        .addFields(
          { name: '👤 Usuário', value: `${target.tag} (${target.id})`, inline: true },
          { name: '🛡️ Moderador', value: `${interaction.user.tag}`, inline: true },
          { name: '📄 Motivo', value: reason },
          { name: '🆔 Caso', value: `#${modCase.caseId}`, inline: true }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({ content: 'Houve um erro ao tentar banir este usuário.' });
    }
  },
};
