import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { GameService } from '../../services/games/GameService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Tente a sorte na máquina de D-Coins da Zero Two!')
    .addIntegerOption(opt => opt.setName('aposta').setDescription('Quantia para apostar').setRequired(true).setMinValue(100)),

  async execute(interaction: ChatInputCommandInteraction) {
    const bet = interaction.options.getInteger('aposta')!;
    await this.runGame(interaction, bet);
  },

  async executeText(message: Message, args: string[]) {
    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet < 100) {
      return message.reply({ content: 'Darling, você precisa apostar pelo menos **100 D-Coins**!' });
    }
    await this.runGame(message, bet);
  },

  async runGame(context: ChatInputCommandInteraction | Message, bet: number) {
    const userId = context instanceof Message ? context.author.id : context.user.id;
    const guildId = context.guildId!;
    const isInteraction = context instanceof ChatInputCommandInteraction;

    const gameResult = await GameService.playSlots(userId, guildId, bet);
    if (!gameResult) {
      const errorMsg = 'Você não tem D-Coins suficientes, Darling! 🦖💢';
      return isInteraction ? context.editReply(errorMsg) : context.reply(errorMsg);
    }

    const { result, win, multiplier } = gameResult;
    let resultMsg = '';

    if (multiplier > 1.5) {
      resultMsg = `${Emojis.achievement} **JACKPOT!**\n\n${Emojis.seta} Você ganhou **${win.toLocaleString()} D-Coins**!`;
    } else if (multiplier > 0) {
      resultMsg = `${Emojis.check} **Quase lá!**\n\n${Emojis.seta_menor} Você ganhou **${win.toLocaleString()} D-Coins**.`;
    } else {
      resultMsg = `${Emojis.ban} **Não foi desta vez.**\n\n${Emojis.seta_menor} Você perdeu **${bet.toLocaleString()} D-Coins**.`;
    }

    const embed = new ZeroTwoEmbed()
      .setTitle('🎰 D-Coins Slots')
      .setDescription(`**[ ${result[0]} | ${result[1]} | ${result[2]} ]**\n\n${resultMsg}\n\n"Quer tentar de novo, Darling?" 🦖❤️`);

    if (isInteraction) {
      await context.editReply({ embeds: [embed] });
    } else {
      await context.reply({ embeds: [embed] });
    }
  },
};
