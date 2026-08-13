import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { Emojis } from '../../utils/emojis.js';

interface Card {
  suit: string;
  name: string;
  value: number;
}

function createDeck(): Card[] {
  const suits = ['♠️', '♥️', '♦️', '♣️'];
  const values = [
    { name: 'Ás', value: 11 },
    { name: '2', value: 2 },
    { name: '3', value: 3 },
    { name: '4', value: 4 },
    { name: '5', value: 5 },
    { name: '6', value: 6 },
    { name: '7', value: 7 },
    { name: '8', value: 8 },
    { name: '9', value: 9 },
    { name: '10', value: 10 },
    { name: 'Valete', value: 10 },
    { name: 'Dama', value: 10 },
    { name: 'Rei', value: 10 },
  ];

  const deck: Card[] = [];
  for (const suit of suits) {
    for (const val of values) {
      deck.push({ suit, name: val.name, value: val.value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function calculateHand(cards: Card[]): number {
  let score = cards.reduce((acc, card) => acc + card.value, 0);
  let aces = cards.filter(c => c.name === 'Ás').length;
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

export default {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Jogue uma partida clássica de Blackjack com a Zero Two')
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Quantidade de D-Coins para apostar')
        .setMinValue(1000)
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('quantidade', true);
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    const balance = await EconomyService.getBalance(userId, guildId);
    if (balance.coins < amount) {
      return interaction.reply({
        content: `${Emojis.warning} **Darling**, você não tem D-Coins suficientes na carteira para apostar ${amount.toLocaleString()}!`,
        ephemeral: true
      });
    }

    await EconomyService.removeCoins(userId, guildId, amount);

    const deck = createDeck();
    const playerHand = [deck.pop()!, deck.pop()!];
    const dealerHand = [deck.pop()!, deck.pop()!];

    const playerScore = calculateHand(playerHand);
    const dealerScore = calculateHand(dealerHand);

    if (playerScore === 21) {
      const winnings = Math.floor(amount * 2.5);
      await EconomyService.addCoins(userId, guildId, winnings, 'Blackjack: Blackjack natural!');
      const embed = new EmbedBuilder()
        .setColor(0xff3b69)
        .setTitle(`${Emojis.achievement} **Blackjack - Vitória Perfeita!**`)
        .setDescription(`Você conseguiu um **Blackjack natural (21)**!\n\nCartas: ${playerHand.map(c => `${c.name}${c.suit}`).join(', ')}\n\nVocê ganhou **${winnings.toLocaleString()} D-Coins** ${Emojis.coin}!`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('bj_hit').setLabel('Pedir (Hit)').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('bj_stand').setLabel('Parar (Stand)').setStyle(ButtonStyle.Success)
    );

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.cat_economia} **Mesa de Blackjack | Zero Two**`)
      .setDescription(
        `**Suas Cartas:** ${playerHand.map(c => `${c.name}${c.suit}`).join(', ')} (Pontos: **${playerScore}**)\n` +
        `**Carta da Banca:** ${dealerHand[0].name}${dealerHand[0].suit}, 🎴\n\n` +
        `*O que você deseja fazer, Darling?*`
      );

    const response = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    collector.on('collect', async i => {
      if (i.user.id !== userId) {
        await i.reply({ content: `${Emojis.warning} **Darling**, esta partida não é sua!`, ephemeral: true });
        return;
      }

      if (i.customId === 'bj_hit') {
        playerHand.push(deck.pop()!);
        const newScore = calculateHand(playerHand);

        if (newScore > 21) {
          collector.stop();
          const loseEmbed = new EmbedBuilder()
            .setColor(0xff3b69)
            .setTitle(`${Emojis.warning} **Blackjack - Estourou! (Bust)**`)
            .setDescription(`Você ultrapassou 21 pontos!\n\nCartas: ${playerHand.map(c => `${c.name}${c.suit}`).join(', ')} (**${newScore}**)\n\n*A Zero Two levou sua aposta de* **${amount.toLocaleString()} D-Coins** ${Emojis.coin}.`);
          await i.update({ embeds: [loseEmbed], components: [] });
          return;
        }

        const updateEmbed = new EmbedBuilder()
          .setColor(0xff3b69)
          .setTitle(`${Emojis.cat_economia} **Mesa de Blackjack | Zero Two**`)
          .setDescription(
            `**Suas Cartas:** ${playerHand.map(c => `${c.name}${c.suit}`).join(', ')} (Pontos: **${newScore}**)\n` +
            `**Carta da Banca:** ${dealerHand[0].name}${dealerHand[0].suit}, 🎴\n\n` +
            `*O que você deseja fazer, Darling?*`
          );
        await i.update({ embeds: [updateEmbed], components: [row] });
      } else if (i.customId === 'bj_stand') {
        collector.stop();
        let finalDealerScore = calculateHand(dealerHand);
        while (finalDealerScore < 17) {
          dealerHand.push(deck.pop()!);
          finalDealerScore = calculateHand(dealerHand);
        }

        const finalPlayerScore = calculateHand(playerHand);
        let resultMsg = '';
        if (finalDealerScore > 21 || finalPlayerScore > finalDealerScore) {
          const reward = amount * 2;
          await EconomyService.addCoins(userId, guildId, reward, 'Blackjack: vitória');
          resultMsg = `🎉 **Parabéns, Darling! Você venceu a banca e ganhou ${reward.toLocaleString()} D-Coins** ${Emojis.coin}!`;
        } else if (finalPlayerScore === finalDealerScore) {
          await EconomyService.addCoins(userId, guildId, amount, 'Blackjack: empate');
          resultMsg = `🤝 **Empate! Sua aposta de ${amount.toLocaleString()} D-Coins foi devolvida.**`;
        } else {
          resultMsg = `💀 **A banca venceu! Você perdeu ${amount.toLocaleString()} D-Coins** ${Emojis.coin}.`;
        }

        const finalEmbed = new EmbedBuilder()
          .setColor(0xff3b69)
          .setTitle(`${Emojis.cat_economia} **Resultado do Blackjack**`)
          .setDescription(
            `**Suas Cartas:** ${playerHand.map(c => `${c.name}${c.suit}`).join(', ')} (**${finalPlayerScore}**)\n` +
            `**Cartas da Banca:** ${dealerHand.map(c => `${c.name}${c.suit}`).join(', ')} (**${finalDealerScore}**)\n\n` +
            resultMsg
          );
        await i.update({ embeds: [finalEmbed], components: [] });
      }
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        await interaction.editReply({ content: `${Emojis.warning} **Darling**, o tempo esgotou e você perdeu sua aposta!`, embeds: [], components: [] }).catch(() => {});
      }
    });
  }
};
