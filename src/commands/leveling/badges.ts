import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { AchievementService } from '../../services/leveling/AchievementService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('badges')
    .setDescription('Exibe os emblemas que você coletou no Garden.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Ver as badges de outro Darling')),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const badges = await AchievementService.getUserBadges(target.id, interaction.guildId!);

    const embed = new ZeroTwoEmbed()
      .setTitle(`🎖️ Emblemas de ${target.username}`)
      .setThumbnail(target.displayAvatarURL());

    if (badges.length === 0) {
      embed.setDescription('Este Darling ainda não possui nenhum emblema. Que tal começar a pilotar agora?');
    } else {
      const badgeList = badges.map((b: any) => `${b.icon} **${b.name}**`).join('\n');
      embed.setDescription(badgeList);
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
