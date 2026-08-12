import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Limpa mensagens do canal atual.')
    .addIntegerOption(opt => opt.setName('quantidade').setDescription('Número de mensagens (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('quantidade')!;
    const channel = interaction.channel as TextChannel;

    try {
      const deleted = await channel.bulkDelete(amount, true);
      
      const embed = ZeroTwoEmbed.success('Limpeza Concluída', `A Zero Two varreu **${deleted.size}** mensagens para debaixo do tapete!`)
        .setFooter({ text: 'Esta mensagem se auto-destruirá em 5 segundos.' });

      await interaction.editReply({ embeds: [embed] });
      setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
    } catch (error) {
      await interaction.editReply({ content: 'Não consegui limpar as mensagens. Certifique-se de que elas não têm mais de 14 dias.' });
    }
  },
};
