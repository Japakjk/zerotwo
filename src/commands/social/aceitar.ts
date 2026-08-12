import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { RelationshipService } from '../../services/social/RelationshipService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('aceitar')
    .setDescription('Aceite um pedido de namoro pendente.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const result = await RelationshipService.accept(interaction.user.id, interaction.guildId!);

    if (!result.success) {
      return interaction.editReply({ content: 'Você não tem nenhum pedido pendente, Darling.' });
    }

    const embed = ZeroTwoEmbed.success('União Confirmada!', `Parabéns! Agora você e <@${result.partnerId}> são parceiros oficiais no Garden. 🦖❤️💍`);
    await interaction.editReply({ embeds: [embed] });
  },
};
