import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ReputationService } from '../../services/social/ReputationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('rep')
    .setDescription('Dê um ponto de reputação para um Darling exemplar.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Quem merece sua reputação?').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario')!;
    const result = await ReputationService.giveRep(interaction.user.id, target.id, interaction.guildId!);

    if (!result.success) {
      if (result.nextAvailable) {
        return interaction.editReply({ content: `Você já deu rep recentemente! Volte em **${ms(result.nextAvailable - Date.now(), { long: true })}**` });
      }
      return interaction.editReply({ content: result.message });
    }

    const embed = ZeroTwoEmbed.success('Reputação Enviada', `Você deu +1 de reputação para **${target.username}**. A Zero Two valoriza bons companheiros! 🦖🌸`);
    await interaction.editReply({ embeds: [embed] });
  },
};
