import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ProfileService } from '../../services/profile/ProfileService.js';
import { AchievementService } from '../../services/leveling/AchievementService.js';
import { RelationshipService } from '../../services/social/RelationshipService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Exibe o seu perfil de pistoqueiro(a) ou de outro Darling.')
    .addUserOption(option =>
      option.setName('usuario').setDescription('O usuário que você deseja inspecionar').setRequired(false),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const profile = await ProfileService.getProfile(targetUser.id, interaction.guildId!);
    if (!profile) {
      return interaction.editReply({ embeds: [ZeroTwoEmbed.error('Erro', 'Não foi possível carregar seu perfil do Garden, Darling.')] });
    }
    const badges = await AchievementService.getUserBadges(targetUser.id, interaction.guildId!);
    const badgeString = badges.length > 0 ? badges.map((b: any) => b.icon).join(' ') : 'Nenhum emblema';

    const rel = await RelationshipService.getRelationship(targetUser.id, interaction.guildId!);
    let partnerInfo = 'Solteiro(a)';
    if (rel) {
      const partnerId = rel.user1Id === targetUser.id ? rel.user2Id : rel.user1Id;
      partnerInfo = `❤️ Com <@${partnerId}>`;
    }

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.cat_interacao} Perfil de ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL())
      .setColor(profile.color as any)
      .addFields(
        { name: `${Emojis.staff} Título`, value: profile.title, inline: true },
        { name: `${Emojis.xp} Nível`, value: `${profile.level} (XP: ${profile.xp})`, inline: true },
        { name: `${Emojis.coin} Coins`, value: `${profile.coins.toLocaleString()} D-Coins`, inline: true },
        { name: `${Emojis.achievement} Badges`, value: badgeString, inline: true },
        { name: `${Emojis.rank} Reputação`, value: `${profile.reputation}`, inline: true },
        { name: `🔥 Streak`, value: `${profile.streak} dias`, inline: true },
        { name: `❤️ Relacionamento`, value: partnerInfo, inline: true },
        { name: `${Emojis.seta_menor} Bio`, value: profile.bio, inline: false },
      );

    if (profile.banner) embed.setImage(profile.banner);

    await interaction.editReply({ embeds: [embed] });
  },
};
