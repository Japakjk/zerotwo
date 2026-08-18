import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { GameService } from '../../services/games/GameService.js';
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
    const side = interaction.options.getString('lado')! as 'cara' | 'coroa';
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

    await this.runGame(message, bet, side as 'cara' | 'coroa');
  },

  async runGame(context: ChatInputCommandInteraction | Message, bet: number, side: 'cara' | 'coroa') {
    const userId = context instanceof Message ? context.author.id : context.user.id;
    const guildId = context.guildId!;
    const isInteraction = context instanceof ChatInputCommandInteraction;

    const gameResult = await GameService.playCoinflip(userId, guildId, bet, side);
    if (!gameResult) {
      const errorMsg = 'Você não tem D-Coins suficientes para essa aposta, Darling! 🦖💢';
      return isInteraction ? context.editReply(errorMsg) : context.reply(errorMsg);
    }

    const { result, win, won } = gameResult;

    if (won) {
      const embed = new ZeroTwoEmbed()
        .setTitle(`${Emojis.check} Você Ganhou!`)
        .setDescription(`${Emojis.seta} A moeda caiu em **${result.toUpperCase()}**!\n\nVocê recebeu **${win.toLocaleString()} D-Coins**. A Zero Two adora vencedores! 🦖🌸`);
      
      if (isInteraction) await context.editReply({ embeds: [embed] });
      else await context.reply({ embeds: [embed] });
    } else {
      const embed = new ZeroTwoEmbed()
        .setTitle(`${Emojis.ban} Você Perdeu!`)
        .setDescription(`${Emojis.seta_menor} A moeda caiu em **${result.toUpperCase()}**...\n\nVocê perdeu **${bet.toLocaleString()} D-Coins**. Tente novamente, Darling! ❤️`);
      
      if (isInteraction) await context.editReply({ embeds: [embed] });
      else await context.reply({ embeds: [embed] });
    }
  },
};
