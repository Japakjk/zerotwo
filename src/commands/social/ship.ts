import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Message } from 'discord.js';
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
    await this.calculate(user1, user2, (payload: any) => interaction.editReply(payload));
  },

  async executeText(message: Message) {
    const users = [...message.mentions.users.values()];
    const user1 = users[0];
    const user2 = users[1] || message.author;
    if (!user1) return message.reply({ content: 'Mencione pelo menos o primeiro Darling. Exemplo: `zero!ship @usuario @usuario`' });
    await this.calculate(user1, user2, (payload: any) => message.reply(payload));
  },

  async calculate(user1: { id: string; toString(): string }, user2: { id: string; toString(): string }, send: (payload: any) => Promise<unknown>) {
    const combined = parseInt(user1.id.slice(-4)) + parseInt(user2.id.slice(-4));
    const percentage = combined % 101;

    let comment = 'A Zero Two acha que vocês formam um casal interessante!';
    const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));

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

    await send({ embeds: [embed] });
  }
};
