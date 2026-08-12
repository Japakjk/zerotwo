import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('tapa')
    .setDescription('Dê um tapa em alguém (com carinho ou não).')
    .addUserOption(opt => opt.setName('usuario').setDescription('Quem vai levar o tapa?').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario')!;
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    let reward = Math.floor(Math.random() * (250000 - 100000 + 1)) + 100000;
    const multiplier = await EconomyService.getVipMultiplier(userId, guildId);
    reward = Math.floor(reward * multiplier);

    await EconomyService.addCoins(userId, guildId, reward, 'Interação Social: tapa');

    const embed = new ZeroTwoEmbed()
      .setDescription(`**${interaction.user.username}** deu um tapa em **${target.username}**! "Ei! Acorda, Darling!" 🦖💢`)
      .setFooter({ text: `+ ${reward.toLocaleString()} D-Coins acumuladas! 🦖🌸` });

    await interaction.editReply({ content: `<@${target.id}>`, embeds: [embed] });
  },
};
