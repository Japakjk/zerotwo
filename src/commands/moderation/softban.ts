import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Message } from 'discord.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Bane e desbane um membro imediatamente para limpar suas mensagens.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O membro a ser softbanido').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('O motivo').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido.';
    const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.editReply({ content: 'Eu não tenho poder suficiente para banir esse Darling!' });
    }

    try {
      await interaction.guild?.members.ban(target.id, { reason, deleteMessageSeconds: 7 * 24 * 60 * 60 });
      await interaction.guild?.members.unban(target.id, 'Softban: Limpeza de mensagens');
      
      const modCase = await ModerationService.createCase(interaction.guild!, target.id, interaction.user.id, 'softban', reason);

      const embed = ZeroTwoEmbed.success('Softban Aplicado', `O usuário **${target.tag}** foi banido e desbanido para limpeza de mensagens.`)
        .addFields(
          { name: '👤 Usuário', value: `${target.tag}`, inline: true },
          { name: '📄 Motivo', value: reason },
          { name: '🆔 Caso', value: `#${modCase.caseId}`, inline: true }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[softban] falha ao aplicar softban', { guildId: interaction.guildId, targetId: target.id, moderatorId: interaction.user.id, error });
      await interaction.editReply({ embeds: [ZeroTwoEmbed.error('Softban não concluído', 'O Discord recusou o banimento temporário. Verifique `BanMembers` e a hierarquia de cargos.') ] });
    }
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply({ embeds: [ZeroTwoEmbed.permissionError('BanMembers')] });
    }

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    const reason = args.slice(1).join(' ') || 'Nenhum motivo fornecido.';

    if (!target) return message.reply({ content: 'Mencione um Darling para softbanir!' });

    try {
      await message.guild?.members.ban(target.id, { reason, deleteMessageSeconds: 7 * 24 * 60 * 60 });
      await message.guild?.members.unban(target.id, 'Softban: Limpeza de mensagens');
      const modCase = await ModerationService.createCase(message.guild!, target.id, message.author.id, 'softban', reason);
      await message.reply({ content: `${Emojis.check} **${target.tag}** softbanido com sucesso! (Caso #${modCase.caseId})` });
    } catch (error) {
      console.error('[softban] falha ao aplicar softban por prefixo', { guildId: message.guildId, targetId: target.id, moderatorId: message.author.id, error });
      await message.reply({ embeds: [ZeroTwoEmbed.error('Softban não concluído', 'O Discord recusou o banimento temporário. Verifique `BanMembers` e a hierarquia de cargos.') ] });
    }
  }
};
