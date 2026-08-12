import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { LevelService } from '../../services/leveling/LevelService.js';
import { ProfileService } from '../../services/profile/ProfileService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Mostra o seu nível e progresso atual no Garden.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O Darling que você quer ver o rank').setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const profile = await ProfileService.getProfile(target.id, interaction.guildId!);
    
    const nextLevelXP = LevelService.getXPForLevel(profile.level);
    const progress = (profile.xp / nextLevelXP) * 100;

    const embed = new ZeroTwoEmbed()
      .setTitle(`📊 Rank de ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '⭐ Nível', value: `${profile.level}`, inline: true },
        { name: '✨ XP Atual', value: `${profile.xp.toLocaleString()} / ${nextLevelXP.toLocaleString()}`, inline: true },
        { name: '📈 Progresso', value: `\`${progress.toFixed(1)}%\` para o próximo nível.`, inline: false }
      );

    await interaction.editReply({ embeds: [embed] });
  },
};
