import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('banco')
    .setDescription('Gerencie seus D-Coins no banco da Zero Two.')
    .addSubcommand(sub => 
      sub.setName('depositar').setDescription('Deposita coins no banco.').addIntegerOption(opt => opt.setName('quantia').setDescription('Quantia para depositar').setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName('sacar').setDescription('Saca coins do banco.').addIntegerOption(opt => opt.setName('quantia').setDescription('Quantia para sacar').setRequired(true))
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const amount = interaction.options.getInteger('quantia')!;
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    if (amount <= 0) return interaction.editReply({ content: `${Emojis.warning} **Darling**, você não pode usar valores negativos!` });

    if (sub === 'depositar') {
      const success = await EconomyService.deposit(userId, guildId, amount);
      if (!success) return interaction.editReply({ content: `${Emojis.warning} **Darling**, você não tem coins suficientes na carteira!` });
      
      return interaction.editReply({
        embeds: [ZeroTwoEmbed.success('Depósito Realizado', `${Emojis.bank} Você guardou **${amount.toLocaleString()} D-Coins** no banco. Estão seguros comigo!`)]
      });
    } else {
      const success = await EconomyService.withdraw(userId, guildId, amount);
      if (!success) return interaction.editReply({ content: `${Emojis.warning} **Darling**, você não tem coins suficientes no banco!` });
      
      return interaction.editReply({
        embeds: [ZeroTwoEmbed.success('Saque Realizado', `${Emojis.wallet} Você retirou **${amount.toLocaleString()} D-Coins** do banco.`)]
      });
    }
  },

  async executeText(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    const amount = Number(args[1]);
    const userId = message.author.id;
    const guildId = message.guild!.id;

    if (!['depositar', 'sacar'].includes(sub) || !Number.isInteger(amount) || amount <= 0) {
      return message.reply({ content: `${Emojis.warning} Use: \`zero!banco depositar <quantia>\` ou \`zero!banco sacar <quantia>\`.` });
    }

    if (sub === 'depositar') {
      const success = await EconomyService.deposit(userId, guildId, amount);
      if (!success) return message.reply({ content: `${Emojis.warning} **Darling**, você não tem coins suficientes na carteira!` });
      return message.reply({ embeds: [ZeroTwoEmbed.success('Depósito Realizado', `${Emojis.bank} Você guardou **${amount.toLocaleString()} D-Coins** no banco. Estão seguros comigo!`)] });
    }

    const success = await EconomyService.withdraw(userId, guildId, amount);
    if (!success) return message.reply({ content: `${Emojis.warning} **Darling**, você não tem coins suficientes no banco!` });
    return message.reply({ embeds: [ZeroTwoEmbed.success('Saque Realizado', `${Emojis.wallet} Você retirou **${amount.toLocaleString()} D-Coins** do banco.`)] });
  },
};
