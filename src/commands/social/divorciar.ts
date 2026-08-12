import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { RelationshipService } from '../../services/social/RelationshipService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('divorciar')
    .setDescription('Termine seu relacionamento atual.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const success = await RelationshipService.breakUp(interaction.user.id, interaction.guildId!);

    if (!success) {
      return interaction.editReply({ content: 'Você não está em um relacionamento para terminar.' });
    }

    const embed = ZeroTwoEmbed.warning('Relacionamento Encerrado', 'O vínculo foi quebrado. Vocês agora seguem caminhos diferentes no Garden.');
    await interaction.editReply({ embeds: [embed] });
  },
};
