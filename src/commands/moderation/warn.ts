import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Aplica um aviso a um membro.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O membro').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do aviso').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario')!;
    const reason = interaction.options.getString('motivo')!;

    const modCase = await ModerationService.createCase(interaction.guildId!, target.id, interaction.user.id, 'warn', reason);
    const userCases = await ModerationService.getCases(interaction.guildId!, target.id);
    const warnCount = userCases.filter((c: any) => c.action === 'warn').length;

    const embed = ZeroTwoEmbed.warning('Aviso Aplicado', `O Darling **${target.tag}** recebeu um aviso.`)
      .addFields(
        { name: '📄 Motivo', value: reason },
        { name: '⚠️ Total de Avisos', value: `${warnCount}`, inline: true },
        { name: '🆔 Caso', value: `#${modCase.caseId}`, inline: true }
      );

    await interaction.editReply({ embeds: [embed] });
  },
};
