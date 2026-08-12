import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { GameService } from '../../services/games/GameService.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mines')
    .setDescription('Encontre os diamantes e evite as minas Klaxossauro!')
    .addIntegerOption(opt => opt.setName('aposta').setDescription('Quantia para apostar').setRequired(true).setMinValue(100))
    .addIntegerOption(opt => opt.setName('minas').setDescription('Número de minas (1-24)').setRequired(true).setMinValue(1).setMaxValue(24)),
  async execute(interaction: ChatInputCommandInteraction) {
    const bet = interaction.options.getInteger('aposta')!;
    const minesCount = interaction.options.getInteger('minas')!;
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    const gameState = await GameService.startMines(userId, guildId, bet, minesCount);
    if (!gameState) return interaction.editReply({ content: 'Você não tem D-Coins suficientes!' });

    const renderGrid = () => {
      const rows = [];
      for (let i = 0; i < 5; i++) {
        const row = new ActionRowBuilder<ButtonBuilder>();
        for (let j = 0; j < 5; j++) {
          const idx = i * 5 + j;
          const btn = new ButtonBuilder().setCustomId(`mines_${idx}`).setLabel('?').setStyle(ButtonStyle.Secondary);
          if (gameState.revealed[idx]) {
            if (gameState.grid[idx] === 'mine') {
              btn.setLabel('💣').setStyle(ButtonStyle.Danger).setDisabled(true);
            } else {
              btn.setLabel('💎').setStyle(ButtonStyle.Success).setDisabled(true);
            }
          }
          if (gameState.isFinished) btn.setDisabled(true);
          row.addComponents(btn);
        }
        rows.push(row);
      }
      
      const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('mines_cashout').setLabel(`Sacar (${GameService.calculateMinesMultiplier(minesCount, gameState.diamondsFound)}x)`).setStyle(ButtonStyle.Primary).setDisabled(gameState.diamondsFound === 0 || gameState.isFinished)
      );
      rows.push(controlRow);
      return rows;
    };

    const embed = new ZeroTwoEmbed()
      .setTitle('💣 Mines Klaxossauro')
      .setDescription(`Aposta: **${bet.toLocaleString()} D-Coins**\nMinas: **${minesCount}**\nDiamantes: **${gameState.diamondsFound}**\n\nEncontre os diamantes para aumentar seu multiplicador, Darling!`)
      .setThumbnail('https://i.imgur.com/4M1q3zs.png');

    const response = await interaction.editReply({ embeds: [embed], components: renderGrid() });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

    collector.on('collect', async i => {
      if (i.user.id !== userId) return i.reply({ content: 'Este jogo não é seu!' });

      if (i.customId === 'mines_cashout') {
        gameState.isFinished = true;
        const multiplier = GameService.calculateMinesMultiplier(minesCount, gameState.diamondsFound);
        const win = Math.floor(bet * multiplier);
        await EconomyService.addCoins(userId, guildId, win, 'Venceu no Mines');
        GameService.finishMines(userId, guildId);
        
        embed.setDescription(`💰 **VOCÊ SACOU!**\n\nGanhou **${win.toLocaleString()} D-Coins** (${multiplier}x)!\nA Zero Two sabia que você conseguiria! 🦖🌸`);
        await i.update({ embeds: [embed], components: renderGrid() });
        return collector.stop();
      }

      const idx = parseInt(i.customId.split('_')[1]);
      if (gameState.revealed[idx]) return i.deferUpdate();

      gameState.revealed[idx] = true;
      if (gameState.grid[idx] === 'mine') {
        gameState.isFinished = true;
        GameService.finishMines(userId, guildId);
        embed.setDescription(`💥 **BOOOOM!**\n\nVocê atingiu uma mina e perdeu **${bet.toLocaleString()} D-Coins**.\nNão fique triste, Darling. Tente de novo! ❤️`);
        await i.update({ embeds: [embed], components: renderGrid() });
        return collector.stop();
      } else {
        gameState.diamondsFound++;
        const multiplier = GameService.calculateMinesMultiplier(minesCount, gameState.diamondsFound);
        embed.setDescription(`💎 **Diamante encontrado!**\n\nMultiplicador atual: **${multiplier}x**\nContinue ou saque agora!`);
        await i.update({ embeds: [embed], components: renderGrid() });
      }
    });
  },
};
