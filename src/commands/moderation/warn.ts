import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Message } from 'discord.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Aplica um aviso a um membro.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O membro').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do aviso').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    const reason = interaction.options.getString('motivo', true);
    const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.editReply({ content: 'Membro não encontrado no Garden, Darling!' });

    const modCase = await ModerationService.warn(member, interaction.user.id, reason);
    const userCases = await ModerationService.getCases(interaction.guild!.id, target.id);
    const warnCount = userCases.filter((c: any) => c.action === 'warn').length;

    const embed = ZeroTwoEmbed.warning('Aviso Aplicado', `${Emojis.warning} O Darling **${target.tag}** recebeu um aviso.`)
      .addFields(
        { name: `${Emojis.seta} Motivo`, value: reason },
        { name: `${Emojis.warning} Total de Avisos`, value: `**${warnCount}**`, inline: true },
        { name: `${Emojis.case} Caso`, value: `**#${modCase.caseId}**`, inline: true }
      );

    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) return;

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    const reason = args.slice(1).join(' ');

    if (!target || !reason) {
      return message.reply({ content: 'Uso correto: `zero!warn @usuario [motivo]`' });
    }

    const member = await message.guild?.members.fetch(target.id).catch(() => null);
    if (!member) return message.reply({ content: 'Membro não encontrado!' });

    const modCase = await ModerationService.warn(member, message.author.id, reason);
    const userCases = await ModerationService.getCases(message.guild!.id, target.id);
    const warnCount = userCases.filter((c: any) => c.action === 'warn').length;

    await message.reply({ content: `${Emojis.check} **${target.tag}** avisado com sucesso! (Total: ${warnCount} avisos | Caso #${modCase.caseId})` });
  }
};
