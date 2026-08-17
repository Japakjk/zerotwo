import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Message } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('roleta')
    .setDescription('Aposte seus D-Coins na roleta da Zero Two')
    .addStringOption(option =>
      option.setName('cor')
        .setDescription('Escolha a cor da aposta')
        .setRequired(true)
        .addChoices(
          { name: 'Vermelho (2x)', value: 'vermelho' },
          { name: 'Preto (2x)', value: 'preto' },
          { name: 'Verde / Zero Two (14x)', value: 'verde' }
        ))
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Quantidade de D-Coins para apostar')
        .setMinValue(1000)
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const choice = interaction.options.getString('cor', true);
    const amount = interaction.options.getInteger('quantidade', true);
    await this.play(interaction.user.id, interaction.guildId!, choice, amount, (payload: any) => interaction.editReply(payload));
  },

  async executeText(message: Message, args: string[]) {
    const choice = (args[0] || '').toLowerCase();
    const amount = Number(args[1]);
    if (!['vermelho', 'preto', 'verde'].includes(choice) || !Number.isInteger(amount) || amount < 1000) {
      return message.reply({ content: 'Use `zero!roleta <vermelho|preto|verde> <quantidade>` com aposta mínima de **1.000 D-Coins**.' });
    }
    await this.play(message.author.id, message.guild!.id, choice, amount, (payload: any) => message.reply(payload));
  },

  async play(userId: string, guildId: string, choice: string, amount: number, send: (payload: any) => Promise<unknown>) {
    const balance = await EconomyService.getBalance(userId, guildId);
    if (balance.coins < amount) {
      return send({ content: `${Emojis.warning} **Darling**, você não tem D-Coins suficientes na carteira para esta aposta!` });
    }

    // Sortear resultado: 0 (Verde), 1-7 (Vermelho), 8-14 (Preto)
    const roll = Math.floor(Math.random() * 15);
    let resultColor = 'preto';
    if (roll === 0) resultColor = 'verde';
    else if (roll <= 7) resultColor = 'vermelho';

    const won = choice === resultColor;
    let multiplier = 2;
    if (resultColor === 'verde') multiplier = 14;

    if (won) {
      const winnings = amount * multiplier;
      await EconomyService.addCoins(userId, guildId, winnings - amount, `Venceu na Roleta (${resultColor})`, 'GAME');
      const embed = new EmbedBuilder()
        .setColor(0xff3b69)
        .setTitle(`${Emojis.achievement} **Roleta da Zero Two - Vitória!**`)
        .setDescription(`A bola caiu no **${resultColor.toUpperCase()}**!\n\nParabéns **Darling**, você ganhou **${winnings.toLocaleString()} D-Coins** ${Emojis.coin}!`)
        .setTimestamp();
      await send({ embeds: [embed] });
    } else {
      await EconomyService.removeCoins(userId, guildId, amount, `Perdeu na Roleta (${resultColor})`, 'GAME');
      const embed = new EmbedBuilder()
        .setColor(0xff3b69)
        .setTitle(`${Emojis.warning} **Roleta da Zero Two - Derrota**`)
        .setDescription(`A bola caiu no **${resultColor.toUpperCase()}** (você escolheu *${choice}*).\n\n*A Zero Two levou sua aposta de* **${amount.toLocaleString()} D-Coins** ${Emojis.coin}.`)
        .setTimestamp();
      await send({ embeds: [embed] });
    }
  }
};
