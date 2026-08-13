import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('Calcule a compatibilidade amorosa entre dois Darlings')
    .addUserOption(option =>
      option.setName('primeiro')
        .setDescription('Primeiro usuário')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('segundo')
        .setDescription('Segundo usuário (opcional, padrão é você)')
        .setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const user1 = interaction.options.getUser('primeiro', true);
    const user2 = interaction.options.getUser('segundo') || interaction.user;

    // Gerar compatibilidade baseada nos IDs para ser consistente
    const combined = parseInt(user1.id.slice(-4)) + parseInt(user2.id.slice(-4));
    const percentage = combined % 101;

    let comment = 'A Zero Two acha que vocês formam um casal interessante!';
    let bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));

    if (percentage > 85) {
      comment = 'Perfeitos um para o outro! Como Darling e Strelizia! ❤️';
    } else if (percentage < 30) {
      comment = 'Hum... Acho que isso não vai dar certo no Garden. 💀';
    }

    const embed = new EmbedBuilder()
    .setColor(0xff3b69)
    .setTitle(`${Emojis.cat_interacao} **Calculadora de Ship do Garden**`)
    .setDescription(
      `💖 **Casal:** ${user1} ❤️ ${user2}\n\n` +
      `📊 **Compatibilidade:** **${percentage}%**\n` +
      `\`[${bar}]\`\n\n` +
      `*${comment}*`
    )
    .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
