import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

const emojis = ['🍒', '🍋', '🍇', '💎', '🌸', '🦖'];

export default {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Tente a sorte na máquina de D-Coins da Zero Two!')
    .addIntegerOption(opt => opt.setName('aposta').setDescription('Quantia para apostar').setRequired(true).setMinValue(100)),
  async execute(interaction: ChatInputCommandInteraction) {
    const bet = interaction.options.getInteger('aposta')!;
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    const hasCoins = await EconomyService.removeCoins(userId, guildId, bet);
    if (!hasCoins) return interaction.editReply({ content: 'D-Coins insuficientes!' });

    const slot1 = emojis[Math.floor(Math.random() * emojis.length)];
    const slot2 = emojis[Math.floor(Math.random() * emojis.length)];
    const slot3 = emojis[Math.floor(Math.random() * emojis.length)];

    const won = slot1 === slot2 && slot2 === slot3;
    const partial = (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) && !won;

    let resultMsg = '';
    if (won) {
      const prize = bet * 10;
      await EconomyService.addCoins(userId, guildId, prize, 'Venceu no Slots (Jackpot)');
      resultMsg = `🏆 **JACKPOT!** Você ganhou **${prize.toLocaleString()} D-Coins**!`;
    } else if (partial) {
      const prize = Math.floor(bet * 1.5);
      await EconomyService.addCoins(userId, guildId, prize, 'Venceu no Slots (Parcial)');
      resultMsg = `✨ **Quase lá!** Você ganhou **${prize.toLocaleString()} D-Coins**.`;
    } else {
      resultMsg = `❌ **Não foi desta vez.** Você perdeu **${bet.toLocaleString()} D-Coins**.`;
    }

    const embed = new ZeroTwoEmbed()
      .setTitle('🎰 D-Coins Slots')
      .setDescription(`[ ${slot1} | ${slot2} | ${slot3} ]\n\n${resultMsg}\n\n"Quer tentar de novo, Darling?" 🦖❤️`);

    await interaction.editReply({ embeds: [embed] });
  },
};
