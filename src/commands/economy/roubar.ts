import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { CooldownService } from '../../services/economy/CooldownService.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('roubar')
    .setDescription('Tente roubar D-Coins da carteira de outro Darling (Cuidado!)')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Quem você deseja roubar')
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    if (target.id === userId) {
      return interaction.reply({
        content: `${Emojis.warning} **Darling**, você não pode roubar a si mesmo!`,
        ephemeral: true
      });
    }

    if (target.bot) {
      return interaction.reply({
        content: `${Emojis.warning} **Darling**, você não pode roubar um bot!`,
        ephemeral: true
      });
    }

    const cdCheck = await CooldownService.checkCooldown(userId, guildId, 'roubar');
    if (cdCheck.inCooldown) {
      const minutes = Math.ceil(cdCheck.remaining / 60);
      return interaction.reply({
        content: `${Emojis.warning} **Darling**, você está muito cansado(a) para roubar agora! Aguarde **${minutes} minutos**.`,
        ephemeral: true
      });
    }

    const targetBalance = await EconomyService.getBalance(target.id, guildId);
    if (targetBalance.coins < 5000) {
      return interaction.reply({
        content: `${Emojis.warning} **Darling**, ${target} é muito pobre para valer a pena roubar (menos de 5.000 D-Coins na carteira).`,
        ephemeral: true
      });
    }

    // 40% de chance de sucesso
    const success = Math.random() < 0.40;

    if (success) {
      const stolenAmount = Math.floor(targetBalance.coins * 0.25); // Rouba 25%
      await EconomyService.removeCoins(target.id, guildId, stolenAmount);
      await EconomyService.addCoins(userId, guildId, stolenAmount, 'Roubo bem-sucedido');

      const embed = new EmbedBuilder()
        .setColor(0xff3b69)
        .setTitle(`${Emojis.achievement} **Roubo Bem-Sucedido!**`)
        .setDescription(`Você conseguiu emboscar ${target} e roubou **${stolenAmount.toLocaleString()} D-Coins** ${Emojis.coin}!\n\n*A Zero Two achou isso bastante ousado...*`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      const fine = 10000;
      await EconomyService.removeCoins(userId, guildId, fine);

      const embed = new EmbedBuilder()
        .setColor(0xff3b69)
        .setTitle(`${Emojis.warning} **Roubo Fracassado!**`)
        .setDescription(`Você foi pego(a) em flagrante tentando roubar ${target}!\n\n*A polícia do Garden multou você em* **${fine.toLocaleString()} D-Coins** ${Emojis.coin}.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
};
