import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Verifica a latência da Zero Two.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new ZeroTwoEmbed()
      .setTitle('🏓 Pong!')
      .setDescription(`Latência: **${interaction.client.ws.ping}ms**\nA Zero Two está respondendo rápido, Darling! 🦖🌸`);
    await interaction.editReply({ embeds: [embed] });
  },
};
