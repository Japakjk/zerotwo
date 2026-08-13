import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

const slotIcons = ['🍒', '🍋', '🍇', '💎', '🌸', '🦖'];

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

    const hasCoins = await EconomyService.removeCoins(userId, guildId, bet);
    if (!hasCoins) {
      const errorMsg = 'Você não tem D-Coins suficientes, Darling! 🦖💢';
      return context instanceof Message ? context.reply(errorMsg) : context.editReply(errorMsg);
    }

    const slot1 = slotIcons[Math.floor(Math.random() * slotIcons.length)];
    const slot2 = slotIcons[Math.floor(Math.random() * slotIcons.length)];
    const slot3 = slotIcons[Math.floor(Math.random() * slotIcons.length)];

    const won = slot1 === slot2 && slot2 === slot3;
    const partial = (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) && !won;

    let resultMsg = '';
    let winAmount = 0;

    if (won) {
      winAmount = slot1 === '🦖' ? bet * 15 : bet * 10;
      await EconomyService.addCoins(userId, guildId, winAmount, 'Venceu no Slots (Jackpot)');
      resultMsg = `${Emojis.achievement} **JACKPOT!**\n\n${Emojis.seta} Você ganhou **${winAmount.toLocaleString()} D-Coins**!`;
    } else if (partial) {
      winAmount = Math.floor(bet * 1.5);
      await EconomyService.addCoins(userId, guildId, winAmount, 'Venceu no Slots (Parcial)');
      resultMsg = `${Emojis.check} **Quase lá!**\n\n${Emojis.seta_menor} Você ganhou **${winAmount.toLocaleString()} D-Coins**.`;
    } else {
      resultMsg = `${Emojis.ban} **Não foi desta vez.**\n\n${Emojis.seta_menor} Você perdeu **${bet.toLocaleString()} D-Coins**.`;
    }

    const embed = new ZeroTwoEmbed()
      .setTitle('🎰 D-Coins Slots')
      .setDescription(`**[ ${slot1} | ${slot2} | ${slot3} ]**\n\n${resultMsg}\n\n"Quer tentar de novo, Darling?" 🦖❤️`);

    if (context instanceof Message) {
      await context.reply({ embeds: [embed] });
    } else {
      await context.editReply({ embeds: [embed] });
    }
  },
};
