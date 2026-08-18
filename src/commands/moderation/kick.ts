import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Message } from 'discord.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa um membro do servidor.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O membro a ser expulso').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('O motivo da expulsão').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido.';
    const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.editReply({ content: 'Membro não encontrado no Garden, Darling!' });
    if (!member.kickable) return interaction.editReply({ content: 'Eu não tenho poder suficiente para expulsar esse Darling!' });

    try {
      const modCase = await ModerationService.kick(member, interaction.user.id, reason);

      const embed = ZeroTwoEmbed.success('Membro Expulso', `O usuário **${target.tag}** foi expulso do Garden.`)
        .addFields(
          { name: '👤 Usuário', value: `${target.tag} (${target.id})`, inline: true },
          { name: '📄 Motivo', value: reason },
          { name: '🆔 Caso', value: `#${modCase.caseId}`, inline: true }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[kick] falha ao expulsar membro', { guildId: interaction.guildId, userId: target.id, moderatorId: interaction.user.id, error });
      await interaction.editReply({ embeds: [ZeroTwoEmbed.error('Expulsão não concluída', 'O Discord recusou a expulsão. Verifique minha permissão `KickMembers` e a hierarquia de cargos.') ] });
    }
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply({ embeds: [ZeroTwoEmbed.permissionError('KickMembers')] });
    }

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    const reason = args.slice(1).join(' ') || 'Nenhum motivo fornecido.';

    if (!target) return message.reply({ content: 'Mencione um Darling para expulsar!' });

    const member = await message.guild?.members.fetch(target.id).catch(() => null);
    if (!member || !member.kickable) return message.reply({ content: 'Não posso expulsar este usuário!' });

    try {
      const modCase = await ModerationService.kick(member, message.author.id, reason);
      await message.reply({ content: `${Emojis.check} **${target.tag}** expulso com sucesso! (Caso #${modCase.caseId})` });
    } catch (error) {
      console.error('[kick] falha ao expulsar membro por prefixo', { guildId: message.guildId, userId: target.id, moderatorId: message.author.id, error });
      await message.reply({ embeds: [ZeroTwoEmbed.error('Expulsão não concluída', 'O Discord recusou a expulsão. Verifique `KickMembers` e a hierarquia de cargos.') ] });
    }
  }
};
