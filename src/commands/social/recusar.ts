import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { RelationshipService } from '../../services/social/RelationshipService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('recusar')
    .setDescription('Recuse um pedido de namoro pendente.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const success = await RelationshipService.decline(interaction.user.id, interaction.guildId!);

    if (!success) {
      return interaction.editReply({ content: 'Não há pedidos para recusar.' });
    }

    await interaction.editReply({ content: 'Pedido recusado. O Garden continua o mesmo...' });
  },
};
