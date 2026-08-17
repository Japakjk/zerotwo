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
    const { user: profile, badgeString, partnerInfo, rank, totalUsers } = await ProfileService.getProfileSummary(targetUser.id, interaction.guildId!);
    
    if (!profile) {
      return interaction.editReply({ embeds: [ZeroTwoEmbed.error('Erro', 'Não foi possível carregar o perfil deste Darling.')] });
    }

    // Cálculo de progresso de nível
    const nextLevelXP = (profile.level * 1000) * (profile.level * 0.5);
    const progress = Math.min(100, Math.floor((profile.xp / nextLevelXP) * 100));
    const progressBar = '▮'.repeat(Math.floor(progress / 10)) + '▯'.repeat(10 - Math.floor(progress / 10));

    // Data de entrada no servidor
    const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
    const joinedAt = member ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>` : 'Desconhecido';

    const embed = new ZeroTwoEmbed()
      .setAuthor({ name: `Perfil de Pistoqueiro(a) — ${targetUser.username}`, iconURL: targetUser.displayAvatarURL() })
      .setThumbnail(targetUser.displayAvatarURL())
      .setColor(profile.color as any)
      .setDescription(`*"${profile.bio}"*`)
      .addFields(
        { name: `${Emojis.staff} Título`, value: `\`${profile.title}\``, inline: true },
        { name: `${Emojis.rank} Ranking`, value: `#**${rank}** / ${totalUsers}`, inline: true },
        { name: `${Emojis.n5} VIP`, value: profile.vipLevel > 0 ? `Nível **${profile.vipLevel}**` : 'Nenhum', inline: true },
        
        { name: `${Emojis.xp} Nível & XP`, value: `Nível **${profile.level}**\n${progressBar} (${progress}%)\n\`${profile.xp.toLocaleString()} / ${nextLevelXP.toLocaleString()}\``, inline: true },
        { name: `${Emojis.coin} Economia`, value: `Carteira: **${profile.coins.toLocaleString()}**\nBanco: **${profile.bank.toLocaleString()}**\nPatrimônio: **${(profile.coins + profile.bank).toLocaleString()}**`, inline: true },
        
        { name: `📅 No Garden desde`, value: joinedAt, inline: true },
        { name: `❤️ Relacionamento`, value: partnerInfo, inline: false },
        { name: `${Emojis.achievement} Insígnias (Badges)`, value: badgeString, inline: false },
        
        { name: `📊 Estatísticas`, value: `Reputação: **${profile.reputation}**\nStreak: **${profile.streak}** dias\nMensagens: **${profile.messagesTotal.toLocaleString()}**`, inline: false },
      );

    if (profile.banner) embed.setImage(profile.banner);
    else embed.setImage('https://i.imgur.com/k6K6p0Z.png'); // Banner padrão da Zero Two

    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: any, args: string[]) {
    const targetUser = message.mentions.users.first() || message.author;
    const { user: profile, badgeString, partnerInfo, rank, totalUsers } = await ProfileService.getProfileSummary(targetUser.id, message.guildId!);
    
    const embed = new ZeroTwoEmbed()
      .setAuthor({ name: `Perfil — ${targetUser.username}`, iconURL: targetUser.displayAvatarURL() })
      .setColor(profile.color as any)
      .addFields(
        { name: `Nível ${profile.level}`, value: `XP: ${profile.xp} | Rank: #${rank}`, inline: true },
        { name: `Saldo`, value: `${(profile.coins + profile.bank).toLocaleString()} D-Coins`, inline: true },
        { name: `Relacionamento`, value: partnerInfo, inline: false }
      )
      .setFooter({ text: 'Use /perfil para ver o perfil completo com Canvas!' });

    message.reply({ embeds: [embed] });
  }
};
