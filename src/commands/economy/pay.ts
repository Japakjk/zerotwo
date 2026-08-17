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
      return interaction.editReply({ content: `${Emojis.warning} **Darling**, você não pode transferir coins para si mesmo!` });
    }

    if (target.bot) {
      return interaction.editReply({ content: `${Emojis.warning} **Darling**, bots não precisam de D-Coins!` });
    }

    const success = await EconomyService.transfer(senderId, target.id, guildId, amount);

    if (!success) {
      return interaction.editReply({ content: `${Emojis.warning} **Darling**, você não tem saldo suficiente na carteira para realizar esta transferência!` });
    }

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.cat_economia} **Transferência Realizada**`)
      .setDescription(`**${interaction.user.username}** enviou **${amount.toLocaleString('pt-BR')} D-Coins** ${Emojis.coin} para ${target}!\n\n*A Zero Two registrou essa transação no Garden.*`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: any, args: string[]) {
    const target = message.mentions.users.first();
    const amountStr = args.find(a => !a.includes('<@'));
    const amount = parseInt(amountStr || '0');

    if (!target || isNaN(amount) || amount <= 0) {
      return message.reply(`Use: \`zero.pay @user <quantidade>\`, Darling!`);
    }

    if (target.id === message.author.id) {
      return message.reply(`${Emojis.ban} Você não pode enviar moedas para si mesmo!`);
    }

    if (target.bot) {
      return message.reply(`${Emojis.ban} Bots não precisam de moedas!`);
    }

    const success = await EconomyService.transfer(message.author.id, target.id, message.guildId!, amount);

    if (!success) {
      return message.reply(`${Emojis.ban} Saldo insuficiente na carteira!`);
    }

    message.reply(`${Emojis.seta} Você enviou **${amount.toLocaleString('pt-BR')} D-Coins** para **${target.username}** com sucesso! ${Emojis.achievement}`);
  }
};
