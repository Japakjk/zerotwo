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
      await member.timeout(null, reason);
      const modCase = await ModerationService.createCase(interaction.guild!, target.id, interaction.user.id, 'unmute', reason);

      const embed = ZeroTwoEmbed.success('Silenciamento Removido', `**${target.tag}** agora pode falar novamente no Garden!`)
        .addFields(
          { name: '📄 Motivo', value: reason },
          { name: '🆔 Caso', value: `#${modCase.caseId}`, inline: true }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({ content: 'Não consegui remover o castigo deste Darling.' });
    }
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) return;

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: 'Mencione um Darling para desmutar!' });

    const member = await message.guild?.members.fetch(target.id).catch(() => null);
    if (!member) return message.reply({ content: 'Membro não encontrado.' });

    try {
      await member.timeout(null);
      await message.reply({ content: `${Emojis.check} Silenciamento de **${target.tag}** removido!` });
    } catch (err) {
      await message.reply({ content: 'Erro ao remover silenciamento.' });
    }
  }
};
