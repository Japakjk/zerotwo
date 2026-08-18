import { SlashCommandBuilder, ChatInputCommandInteraction, Message, User } from 'discord.js';
import { AchievementService } from '../../services/leveling/AchievementService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('badges')
    .setDescription('Exibe os emblemas que você coletou no Garden.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Ver as badges de outro Darling')),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const embed = await this.buildEmbed(target, interaction.guildId!);
    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message) {
    const target = message.mentions.users.first() || message.author;
    const embed = await this.buildEmbed(target, message.guild!.id);
    await message.reply({ embeds: [embed] });
  },

  async buildEmbed(target: User, guildId: string) {
    const badges = await AchievementService.getUserBadges(target.id, guildId);
    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.achievement} Emblemas de ${target.username}`)
      .setThumbnail(target.displayAvatarURL());

    if (badges.length === 0) {
      embed.setDescription(`${Emojis.seta} Este **Darling** ainda não possui nenhum emblema. Que tal começar a pilotar agora?`);
    } else {
      const badgeList = badges.map((b: any) => `${b.icon} **${b.name}**`).join('\n');
      embed.setDescription(`${Emojis.seta} Confira as conquistas alcançadas:\n\n${badgeList}`);
    }
    return embed;
  },
};
