import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { RelationshipService } from '../../services/social/RelationshipService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('parceiro')
    .setDescription('Mostra detalhes do seu relacionamento atual.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const rel = await RelationshipService.getRelationship(interaction.user.id, interaction.guildId!);

    if (!rel) {
      return interaction.editReply({ content: 'Você está solteiro(a), Darling. Que tal procurar alguém?' });
    }

    const partnerId = rel.user1Id === interaction.user.id ? rel.user2Id : rel.user1Id;
    const time = Date.now() - rel.startedAt.getTime();

    const embed = new ZeroTwoEmbed()
      .setTitle('💍 Detalhes da União')
      .setDescription(`Você está em um relacionamento com <@${partnerId}>.\n\n⏱️ **Tempo:** ${ms(time, { long: true })}\n❤️ **Tipo:** ${rel.type.toUpperCase()}`)
      .setThumbnail('https://i.imgur.com/4M1q3zs.png');

    await interaction.editReply({ embeds: [embed] });
  },
};
