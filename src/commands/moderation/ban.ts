import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Message } from 'discord.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bane um membro do servidor.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O membro a ser banido').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('O motivo do banimento').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido.';
    const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.editReply({ content: 'Eu não tenho poder suficiente para banir esse Darling!' });
    }

    try {
      await interaction.guild?.members.ban(target.id, { reason });
      const modCase = await ModerationService.createCase(interaction.guild!, target.id, interaction.user.id, 'ban', reason);

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

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) return;

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    const reason = args.slice(1).join(' ') || 'Nenhum motivo fornecido.';

    if (!target) return message.reply({ content: 'Mencione um Darling para banir!' });

    const member = await message.guild?.members.fetch(target.id).catch(() => null);
    if (member && !member.bannable) return message.reply({ content: 'Não posso banir este usuário!' });

    try {
      await message.guild?.members.ban(target.id, { reason });
      const modCase = await ModerationService.createCase(message.guild!, target.id, message.author.id, 'ban', reason);
      await message.reply({ content: `${Emojis.check} **${target.tag}** banido com sucesso! (Caso #${modCase.caseId})` });
    } catch (err) {
      await message.reply({ content: 'Erro ao banir usuário.' });
    }
  }
};
