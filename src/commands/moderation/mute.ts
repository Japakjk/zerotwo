import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Message } from 'discord.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Silencia um membro do servidor (Timeout).')
    .addUserOption(opt => opt.setName('usuario').setDescription('O membro a ser silenciado').setRequired(true))
    .addStringOption(opt => opt.setName('duracao').setDescription('Duração (ex: 10m, 1h, 1d)').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('O motivo do silenciamento').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    const durationStr = interaction.options.getString('duracao', true);
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido.';
    const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.editReply({ content: 'Membro não encontrado no Garden, Darling!' });
    
    const durationMs = ms(durationStr);
    if (!durationMs || durationMs > 28 * 24 * 60 * 60 * 1000) {
      return interaction.editReply({ content: 'Duração inválida, Darling! O máximo é 28 dias.' });
    }

    try {
      const modCase = await ModerationService.timeout(member, interaction.user.id, durationMs, reason);

      const embed = ZeroTwoEmbed.success('Membro Silenciado', `**${target.tag}** foi colocado de castigo.`)
        .addFields(
          { name: '👤 Usuário', value: `${target.tag}`, inline: true },
          { name: '⏳ Duração', value: `${durationStr}`, inline: true },
          { name: '📄 Motivo', value: reason },
          { name: '🆔 Caso', value: `#${modCase.caseId}`, inline: true }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[mute] falha ao aplicar timeout', { guildId: interaction.guildId, userId: target.id, moderatorId: interaction.user.id, durationMs, error });
      await interaction.editReply({ embeds: [ZeroTwoEmbed.error('Silenciamento não concluído', 'O Discord recusou o timeout. Verifique `ModerateMembers`, minha hierarquia e se a duração é válida.') ] });
    }
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply({ embeds: [ZeroTwoEmbed.permissionError('ModerateMembers')] });
    }

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    const durationStr = args[1];
    const reason = args.slice(2).join(' ') || 'Nenhum motivo fornecido.';

    if (!target || !durationStr) {
      return message.reply({ content: 'Uso correto: `zero!mute @usuario 10m (motivo)`' });
    }

    const member = await message.guild?.members.fetch(target.id).catch(() => null);
    if (!member) return message.reply({ content: 'Membro não encontrado.' });

    const durationMs = ms(durationStr);
    if (!durationMs || durationMs > 28 * 24 * 60 * 60 * 1000) {
      return message.reply({ content: `${Emojis.warning} **Duração inválida.** Informe um período de até 28 dias, como 10m ou 1h.` });
    }

    try {
      const modCase = await ModerationService.timeout(member, message.author.id, durationMs, reason);
      await message.reply({ content: `${Emojis.check} **${target.tag}** silenciado por **${durationStr}**! (Caso #${modCase.caseId})` });
    } catch (error) {
      console.error('[mute] falha ao aplicar timeout por prefixo', { guildId: message.guildId, userId: target.id, moderatorId: message.author.id, durationMs, error });
      await message.reply({ embeds: [ZeroTwoEmbed.error('Silenciamento não concluído', 'O Discord recusou o timeout. Verifique `ModerateMembers` e a hierarquia de cargos.') ] });
    }
  }
};
