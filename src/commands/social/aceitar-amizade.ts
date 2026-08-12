import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { FriendshipService } from '../../services/social/FriendshipService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('aceitar-amizade')
    .setDescription('Aceita um pedido de amizade pendente.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Quem enviou o pedido?').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario')!;
    const success = await FriendshipService.acceptRequest(interaction.user.id, target.id, interaction.guildId!);

    if (!success) return interaction.editReply({ content: 'Não há pedidos de amizade pendentes deste usuário.' });

    const embed = ZeroTwoEmbed.success('Amizade Confirmada', `Agora você e <@${target.id}> são amigos oficiais no Garden! 🌸🤝`);
    await interaction.editReply({ embeds: [embed] });
  },
};
