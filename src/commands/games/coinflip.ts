import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

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
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    const hasCoins = await EconomyService.removeCoins(userId, guildId, bet);
    if (!hasCoins) return interaction.editReply({ content: 'Você não tem D-Coins suficientes para essa aposta, Darling!' });

    const result = Math.random() < 0.5 ? 'cara' : 'coroa';
    const won = side === result;

    if (won) {
      const prize = bet * 2;
      await EconomyService.addCoins(userId, guildId, prize, 'Venceu no Coinflip');
      
      const embed = ZeroTwoEmbed.success('Você Ganhou!', `A moeda caiu em **${result}**!\nVocê recebeu **${prize.toLocaleString()} D-Coins**. A Zero Two adora vencedores! 🦖🌸`);
      await interaction.editReply({ embeds: [embed] });
    } else {
      const embed = ZeroTwoEmbed.error('Você Perdeu!', `A moeda caiu em **${result}**...\nVocê perdeu **${bet.toLocaleString()} D-Coins**. Tente novamente, Darling! ❤️`);
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
