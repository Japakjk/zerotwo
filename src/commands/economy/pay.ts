import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Transfira D-Coins para outro Darling')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Quem vai receber os D-Coins')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Quantidade de D-Coins para transferir')
        .setMinValue(1)
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    const amount = interaction.options.getInteger('quantidade', true);
    const senderId = interaction.user.id;
    const guildId = interaction.guildId!;

    if (target.id === senderId) {
      return interaction.reply({
        content: `${Emojis.warning} **Darling**, você não pode transferir coins para si mesmo!`,
        ephemeral: true
      });
    }

    if (target.bot) {
      return interaction.reply({
        content: `${Emojis.warning} **Darling**, bots não precisam de D-Coins!`,
        ephemeral: true
      });
    }

    const success = await EconomyService.transfer(senderId, target.id, guildId, amount);

    if (!success) {
      return interaction.reply({
        content: `${Emojis.warning} **Darling**, você não tem saldo suficiente na carteira para realizar esta transferência!`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.cat_economia} **Transferência Realizada**`)
      .setDescription(`**${interaction.user.username}** enviou **${amount.toLocaleString()} D-Coins** ${Emojis.coin} para ${target}!\n\n*A Zero Two registrou essa transação no Garden.*`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
