import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ReputationService } from '../../services/social/ReputationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('toprep')
    .setDescription('Mostra os Darlings com mais reputação no Garden.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const top = await ReputationService.getTopRep(interaction.guildId!);
    if (top.length === 0) return interaction.editReply({ content: 'Ninguém tem reputação ainda, Darling.' });

    const list = top.map((u: any, i: number) => `**${i + 1}.** <@${u.userId}> — **${u.reputation}** reps`).join('\n');
    const embed = new ZeroTwoEmbed().setTitle('⭐ Darlings mais Populares').setDescription(list);
    await interaction.editReply({ embeds: [embed] });
  },
};
