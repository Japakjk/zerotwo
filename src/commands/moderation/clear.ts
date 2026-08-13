import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, Message } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Limpa mensagens do canal atual.')
    .addIntegerOption(opt => opt.setName('quantidade').setDescription('Número de mensagens (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('quantidade', true);
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

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return;

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply({ content: 'Forneça uma quantidade entre 1 e 100, Darling!' });
    }

    try {
      const channel = message.channel as TextChannel;
      if (!channel.bulkDelete) return;

      await message.delete().catch(() => {});
      const deleted = await channel.bulkDelete(amount, true);
      
      const msg = await channel.send({ content: `${Emojis.check} **${deleted.size}** mensagens limpas com sucesso!` });
      setTimeout(() => msg.delete().catch(() => {}), 5000);
    } catch (err) {
      await message.reply({ content: 'Erro ao limpar mensagens.' });
    }
  }
};
