import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { LevelService } from '../../services/leveling/LevelService.js';
import { ProfileService } from '../../services/profile/ProfileService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

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
    const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.rank} Rank de ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: `${Emojis.rank} Nível`, value: `**${profile.level}**`, inline: true },
        { name: `${Emojis.xp} XP Atual`, value: `**${profile.xp.toLocaleString()}** / ${nextLevelXP.toLocaleString()}`, inline: true },
        { name: `${Emojis.seta} Progresso`, value: `\`${progressBar}\` **${progress.toFixed(1)}%**`, inline: false }
      )
      .setFooter({ text: 'Continue pilotando para subir de nível, Darling!' });

    await interaction.editReply({ embeds: [embed] });
  },
};
