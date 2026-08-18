import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder().setName('mensal').setDescription('Resgate suas D-Coins mensais.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const result = await EconomyService.claimMonthly(interaction.user.id, interaction.guildId!);
    if (!result.success) {
      return interaction.editReply({ content: `Ainda não, Darling! Volte em **${ms(result.nextAvailable! - Date.now(), { long: true })}**` });
    }
    const embed = ZeroTwoEmbed.success('Recompensa Mensal', `Você resgatou **${result.amount?.toLocaleString()} D-Coins**! O Garden orgulha-se de você. 🦖🌸`);
    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message) {
    const result = await EconomyService.claimMonthly(message.author.id, message.guildId!);
    if (!result.success) {
      return message.reply({ content: `Ainda não, Darling! Volte em **${ms(result.nextAvailable! - Date.now(), { long: true })}**` });
    }
    const embed = ZeroTwoEmbed.success('Recompensa Mensal', `Você resgatou **${result.amount?.toLocaleString()} D-Coins**! O Garden orgulha-se de você. 🦖🌸`);
    await message.reply({ embeds: [embed] });
  },
};
