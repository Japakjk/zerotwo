import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('crash')
    .setDescription('Aposte e saia antes que o Franxx caia!')
    .addIntegerOption(opt => opt.setName('aposta').setDescription('Quantia para apostar').setRequired(true).setMinValue(100)),
  async execute(interaction: ChatInputCommandInteraction) {
    const bet = interaction.options.getInteger('aposta')!;
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    const hasCoins = await EconomyService.removeCoins(userId, guildId, bet);
    if (!hasCoins) return interaction.editReply({ content: 'D-Coins insuficientes!' });

    let multiplier = 1.0;
    let crashed = false;
    let cashedOut = false;
    const crashPoint = Math.random() < 0.1 ? 1.0 : parseFloat((1 + Math.random() * 5).toFixed(2)); // Simplified logic

    const embed = new ZeroTwoEmbed()
      .setTitle('🚀 Crash Franxx')
      .setDescription(`Aposta: **${bet.toLocaleString()} D-Coins**\nMultiplicador: **${multiplier.toFixed(2)}x**\n\nSaia antes que caia, Darling!`)
      .setThumbnail('https://i.imgur.com/4M1q3zs.png');

    const btn = new ButtonBuilder().setCustomId('crash_out').setLabel('CASH OUT').setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);

    const response = await interaction.editReply({ embeds: [embed], components: [row] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

    const gameInterval = setInterval(async () => {
      if (cashedOut || crashed) {
        clearInterval(gameInterval);
        return;
      }

      multiplier += 0.2;
      if (multiplier >= crashPoint) {
        crashed = true;
        clearInterval(gameInterval);
        embed.setDescription(`💥 **CRASHED em ${multiplier.toFixed(2)}x!**\n\nVocê perdeu **${bet.toLocaleString()} D-Coins**. O Franxx não aguentou... ❤️`);
        await interaction.editReply({ embeds: [embed], components: [] });
        collector.stop();
      } else {
        embed.setDescription(`🚀 Multiplicador: **${multiplier.toFixed(2)}x**\n\nSaia agora ou arrisque mais!`);
        await interaction.editReply({ embeds: [embed] });
      }
    }, 2000);

    collector.on('collect', async i => {
      if (i.user.id !== userId) return i.reply({ content: 'Não é seu jogo!' });
      if (cashedOut || crashed) return;

      cashedOut = true;
      clearInterval(gameInterval);
      const win = Math.floor(bet * multiplier);
      await EconomyService.addCoins(userId, guildId, win, 'Venceu no Crash');
      
      embed.setDescription(`💰 **CASH OUT!**\n\nVocê saiu em **${multiplier.toFixed(2)}x** e ganhou **${win.toLocaleString()} D-Coins**!\nExcelente pilotagem, Darling! 🦖🌸`);
      await i.update({ embeds: [embed], components: [] });
      collector.stop();
    });
  },
};
