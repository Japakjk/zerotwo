import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { BalanceCardService } from '../../services/economy/BalanceCardService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('saldo')
    .setDescription('Verifica quantos D-Coins você possui na carteira e no banco com cartão visual.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const balance = await EconomyService.getBalance(interaction.user.id, interaction.guildId!);
    const avatarURL = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });

    const attachment = await BalanceCardService.generateCard(
      interaction.user.username,
      avatarURL,
      balance.coins,
      balance.bank
    );

    await interaction.editReply({ files: [attachment] });
  },
};
