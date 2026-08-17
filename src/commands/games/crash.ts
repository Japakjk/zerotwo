import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Message } from 'discord.js';
import { GameService } from '../../services/games/GameService.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('crash')
    .setDescription('Aposte e saia antes que o Franxx caia!')
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

    const gameData = await GameService.processCrash(userId, guildId, bet);
    if (!gameData) {
      const errorMsg = 'Você não tem D-Coins suficientes, Darling! 🦖💢';
      return isInteraction ? context.editReply(errorMsg) : context.reply(errorMsg);
    }

    const { crashPoint } = gameData;
    let multiplier = 1.0;
    let crashed = false;
    let cashedOut = false;

    const embed = new ZeroTwoEmbed()
      .setTitle(`🚀 Crash Franxx`)
      .setDescription(`${Emojis.coin} Aposta: **${bet.toLocaleString()} D-Coins**\n${Emojis.seta} Multiplicador: **${multiplier.toFixed(2)}x**\n\nSaia antes que caia, Darling!`)
      .setThumbnail('https://i.imgur.com/4M1q3zs.png');

    const btn = new ButtonBuilder().setCustomId('crash_out').setLabel('CASH OUT').setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);

    const response = isInteraction 
      ? await context.editReply({ embeds: [embed], components: [row] })
      : await context.reply({ embeds: [embed], components: [row] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

    const gameInterval = setInterval(async () => {
      if (cashedOut || crashed) {
        clearInterval(gameInterval);
        return;
      }

      const increment = multiplier < 2 ? 0.1 : multiplier < 5 ? 0.2 : 0.5;
      multiplier = parseFloat((multiplier + increment).toFixed(2));

      if (multiplier >= crashPoint) {
        crashed = true;
        clearInterval(gameInterval);
        embed.setDescription(`${Emojis.ban} **CRASHED em ${multiplier.toFixed(2)}x!**\n\nVocê perdeu **${bet.toLocaleString()} D-Coins**. O Franxx não aguentou... ❤️`);
        
        if (isInteraction) await context.editReply({ embeds: [embed], components: [] }).catch(() => {});
        else await response.edit({ embeds: [embed], components: [] }).catch(() => {});
        
        collector.stop();
      } else {
        embed.setDescription(`${Emojis.coin} Aposta: **${bet.toLocaleString()} D-Coins**\n${Emojis.seta} Multiplicador: **${multiplier.toFixed(2)}x**\n\nSaia agora ou arrisque mais, Darling!`);
        
        if (isInteraction) await context.editReply({ embeds: [embed] }).catch(() => {});
        else await response.edit({ embeds: [embed] }).catch(() => {});
      }
    }, 1500);

    collector.on('collect', async i => {
      if (i.user.id !== userId) return i.reply({ content: 'Este jogo não é seu, Darling! 🦖💢', ephemeral: true });
      if (cashedOut || crashed) return;

      cashedOut = true;
      clearInterval(gameInterval);
      const win = Math.floor(bet * multiplier);
      await EconomyService.addCoins(userId, guildId, win, 'Venceu no Crash');
      
      embed.setDescription(`${Emojis.check} **CASH OUT!**\n\nVocê saiu em **${multiplier.toFixed(2)}x** e ganhou **${win.toLocaleString()} D-Coins**!\nExcelente pilotagem, Darling! 🦖🌸`);
      await i.update({ embeds: [embed], components: [] });
      collector.stop();
    });

    collector.on('end', () => {
      clearInterval(gameInterval);
    });
  },
};
