import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Coloca um membro de castigo (timeout).')
    .addUserOption(opt => opt.setName('usuario').setDescription('O membro').setRequired(true))
    .addStringOption(opt => opt.setName('duracao').setDescription('Duração (ex: 10m, 1h, 1d)').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({ content: 'Esse comando só pode ser usado em um servidor.', ephemeral: true });
    }

    const target = interaction.options.getUser('usuario')!;
    const durationStr = interaction.options.getString('duracao')!;
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido.';
    const member = await guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.reply({ content: 'Membro não encontrado.', ephemeral: true });

    const durationMs = ms(durationStr);
    if (!durationMs || durationMs > 28 * 24 * 60 * 60 * 1000) {
      return interaction.reply({ content: 'Duração inválida! O máximo é 28 dias.', ephemeral: true });
    }

    try {
      await member.timeout(durationMs, reason);
      const modCase = await ModerationService.createCase(guild, target.id, interaction.user.id, 'timeout', reason, durationStr);

      const embed = ZeroTwoEmbed.success('Membro em Castigo', `**${target.tag}** agora está em silêncio por **${durationStr}**.`)
        .addFields(
          { name: '📄 Motivo', value: reason },
          { name: '🆔 Caso', value: `#${modCase.caseId}`, inline: true }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({ content: 'Não consegui aplicar o timeout.' });
    }
  },
};
