import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder().setName('semanal').setDescription('Resgate suas D-Coins semanais.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const result = await EconomyService.claimWeekly(interaction.user.id, interaction.guildId!);
    if (!result.success) {
      return interaction.editReply({ content: `Ainda não, Darling! Volte em **${ms(result.nextAvailable! - Date.now(), { long: true })}**` });
    }
    const embed = ZeroTwoEmbed.success('Recompensa Semanal', `Você resgatou **${result.amount?.toLocaleString()} D-Coins**! Continue pilotando bem. 🦖🌸`);
    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message) {
    const result = await EconomyService.claimWeekly(message.author.id, message.guildId!);
    if (!result.success) {
      return message.reply({ content: `Ainda não, Darling! Volte em **${ms(result.nextAvailable! - Date.now(), { long: true })}**` });
    }
    const embed = ZeroTwoEmbed.success('Recompensa Semanal', `Você resgatou **${result.amount?.toLocaleString()} D-Coins**! Continue pilotando bem. 🦖🌸`);
    await message.reply({ embeds: [embed] });
  },
};
