import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { AchievementModel } from '../../database/models/Achievement.js';
import { ACHIEVEMENTS } from '../../services/leveling/AchievementService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('conquistas')
    .setDescription('Veja suas conquistas e desafios no Garden.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = await this.buildEmbed(interaction.user.id, interaction.guildId!);
    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message) {
    const embed = await this.buildEmbed(message.author.id, message.guild!.id);
    await message.reply({ embeds: [embed] });
  },

  async buildEmbed(userId: string, guildId: string) {
    const userAchievements = await AchievementModel.find({
      userId,
      guildId
    });
    const earnedIds = userAchievements.map((a: any) => a.achievementId);

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.achievement} Suas Conquistas`)
      .setDescription(`${Emojis.seta} Aqui está o seu progresso nos desafios da Zero Two, **Darling**!`);

    const list = ACHIEVEMENTS.map(ach => {
      const isEarned = earnedIds.includes(ach.id);
      return `${isEarned ? Emojis.check : Emojis.lock || '🔒'} **${ach.name}**\n*${ach.description}*`;
    }).join('\n\n');

    embed.addFields({ name: `${Emojis.achievement} Lista de Desafios`, value: list });
    return embed;
  },
};
