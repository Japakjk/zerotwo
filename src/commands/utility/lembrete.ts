import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lembrete')
    .setDescription('Defina um lembrete para a Zero Two te avisar')
    .addStringOption(option =>
      option.setName('tempo')
        .setDescription('Tempo (ex: 30m, 2h, 1d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('motivo')
        .setDescription('O que você quer que eu te lembre')
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const tempo = interaction.options.getString('tempo', true);
    const motivo = interaction.options.getString('motivo', true);

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.cat_utilidades} **Lembrete Registrado**`)
      .setDescription(`Entendido, **Darling**! Vou te lembrar sobre:\n\n> *"${motivo}"*\n\n⏳ **Tempo:** \`${tempo}\``)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
