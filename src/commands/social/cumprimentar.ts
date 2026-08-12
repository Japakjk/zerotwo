import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { SocialService } from '../../services/social/SocialService.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cumprimentar')
    .setDescription('Interaja com outro Darling.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Com quem você quer interagir?').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario')!;
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    // Recompensa: 100k a 250k
    let reward = Math.floor(Math.random() * (250000 - 100000 + 1)) + 100000;
    const multiplier = await EconomyService.getVipMultiplier(userId, guildId);
    reward = Math.floor(reward * multiplier);

    await EconomyService.addCoins(userId, guildId, reward, `Interação Social: cumprimentar`);

    const embed = SocialService.getInteractionEmbed('cumprimentar', interaction.user.username, target.username);
    embed.setFooter({ text: `+ ${reward.toLocaleString()} D-Coins acumuladas! 🦖🌸` });

    await interaction.editReply({ content: `<@${target.id}>`, embeds: [embed] });
  },
};
