import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Aposte suas D-Coins no cara ou coroa.')
    .addIntegerOption(opt => opt.setName('aposta').setDescription('Quantia para apostar').setRequired(true).setMinValue(100))
    .addStringOption(opt => opt.setName('lado').setDescription('Escolha seu lado').setRequired(true).addChoices(
      { name: 'Cara', value: 'cara' },
      { name: 'Coroa', value: 'coroa' }
    )),

  async execute(interaction: ChatInputCommandInteraction) {
    const bet = interaction.options.getInteger('aposta')!;
    const side = interaction.options.getString('lado')!;
    await this.runGame(interaction, bet, side);
  },

  async executeText(message: Message, args: string[]) {
    const bet = parseInt(args[0]);
    const side = args[1]?.toLowerCase();

    if (isNaN(bet) || bet < 100) {
      return message.reply({ content: 'Darling, você precisa apostar pelo menos **100 D-Coins**!' });
    }
    if (side !== 'cara' && side !== 'coroa') {
      return message.reply({ content: 'Você precisa escolher entre **cara** ou **coroa**, Darling!' });
    }

    await this.runGame(message, bet, side);
  },

  async runGame(context: ChatInputCommandInteraction | Message, bet: number, side: string) {
    const userId = context instanceof Message ? context.author.id : context.user.id;
    const guildId = context.guildId!;

    const hasCoins = await EconomyService.removeCoins(userId, guildId, bet);
    if (!hasCoins) {
      const errorMsg = 'Você não tem D-Coins suficientes para essa aposta, Darling! 🦖💢';
      return context instanceof Message ? context.reply(errorMsg) : context.editReply(errorMsg);
    }

    const result = Math.random() < 0.5 ? 'cara' : 'coroa';
    const won = side === result;

    if (won) {
      const prize = bet * 2;
      await EconomyService.addCoins(userId, guildId, prize, 'Venceu no Coinflip');
      
      const embed = new ZeroTwoEmbed()
        .setTitle(`${Emojis.check} Você Ganhou!`)
        .setDescription(`${Emojis.seta} A moeda caiu em **${result.toUpperCase()}**!\n\nVocê recebeu **${prize.toLocaleString()} D-Coins**. A Zero Two adora vencedores! 🦖🌸`);
      
      if (context instanceof Message) {
        await context.reply({ embeds: [embed] });
      } else {
        await context.editReply({ embeds: [embed] });
      }
    } else {
      const embed = new ZeroTwoEmbed()
        .setTitle(`${Emojis.ban} Você Perdeu!`)
        .setDescription(`${Emojis.seta_menor} A moeda caiu em **${result.toUpperCase()}**...\n\nVocê perdeu **${bet.toLocaleString()} D-Coins**. Tente novamente, Darling! ❤️`);
      
      if (context instanceof Message) {
        await context.reply({ embeds: [embed] });
      } else {
        await context.editReply({ embeds: [embed] });
      }
    }
  },
};
