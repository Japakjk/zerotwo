import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa um membro do servidor.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O membro a ser expulso').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('O motivo da expulsão').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario')!;
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido.';
    const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (!member || !member.kickable) {
      return interaction.editReply({ content: 'Eu não posso expulsar este Darling. Verifique minha hierarquia!' });
    }

    try {
      await member.kick(reason);
      const modCase = await ModerationService.createCase(interaction.guildId!, target.id, interaction.user.id, 'kick', reason);

      const embed = ZeroTwoEmbed.success('Membro Expulso', `O usuário **${target.tag}** foi convidado a se retirar.`)
        .addFields(
          { name: '🛡️ Moderador', value: `${interaction.user.tag}`, inline: true },
          { name: '📄 Motivo', value: reason },
          { name: '🆔 Caso', value: `#${modCase.caseId}`, inline: true }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({ content: 'Erro ao tentar expulsar o usuário.' });
    }
  },
};
