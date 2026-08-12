import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { FriendshipService } from '../../services/social/FriendshipService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('amigo')
    .setDescription('Gerencie suas amizades no Garden.')
    .addSubcommand(sub => sub.setName('adicionar').setDescription('Envia um pedido de amizade.').addUserOption(opt => opt.setName('usuario').setDescription('Quem você quer adicionar?').setRequired(true)))
    .addSubcommand(sub => sub.setName('remover').setDescription('Remove um amigo.').addUserOption(opt => opt.setName('usuario').setDescription('Quem você quer remover?').setRequired(true)))
    .addSubcommand(sub => sub.setName('lista').setDescription('Mostra sua lista de amigos.')),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    if (sub === 'adicionar') {
      const target = interaction.options.getUser('usuario')!;
      const result = await FriendshipService.sendRequest(userId, target.id, guildId);
      if (!result.success) return interaction.editReply({ content: result.message });
      
      const embed = new ZeroTwoEmbed().setTitle('🌸 Pedido de Amizade').setDescription(`**${interaction.user.username}** quer ser seu amigo, <@${target.id}>!\nUse \`/aceitar-amizade\` para confirmar.`);
      return interaction.editReply({ content: `<@${target.id}>`, embeds: [embed] });
    }

    if (sub === 'remover') {
      const target = interaction.options.getUser('usuario')!;
      const success = await FriendshipService.removeFriend(userId, target.id, guildId);
      if (!success) return interaction.editReply({ content: 'Vocês não são amigos.' });
      return interaction.editReply({ content: 'Amigo removido. O Garden ficou um pouco mais vazio...' });
    }

    if (sub === 'lista') {
      const friends = await FriendshipService.getFriends(userId, guildId);
      if (friends.length === 0) return interaction.editReply({ content: 'Você ainda não tem amigos no Garden, Darling. Que tal fazer alguns?' });
      
      const list = friends.map(f => {
        const friendId = f.user1Id === userId ? f.user2Id : f.user1Id;
        return `<@${friendId}>`;
      }).join(', ');

      const embed = new ZeroTwoEmbed().setTitle('🤝 Seus Amigos').setDescription(list);
      return interaction.editReply({ embeds: [embed] });
    }
  },
};
