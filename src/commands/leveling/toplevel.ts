import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { LevelService } from '../../services/leveling/LevelService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('toplevel')
    .setDescription('Mostra os Darlings com os maiores níveis do servidor.'),
  async execute(interaction: ChatInputCommandInteraction) {
    await this.render(interaction.guildId!, interaction.client.user.displayAvatarURL(), (payload: any) => interaction.editReply(payload));
  },

  async executeText(message: Message) {
    await this.render(message.guild!.id, message.client.user.displayAvatarURL(), (payload: any) => message.reply(payload));
  },

  async render(guildId: string, botAvatar: string, send: (payload: any) => Promise<unknown>) {
    const leaderboard = await LevelService.getLeaderboard(guildId);

    if (leaderboard.length === 0) {
      return send({ content: 'Ainda não há ninguém no ranking, Darling!' });
    }

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.rank} Top Darlings do Garden`)
      .setDescription('Aqui estão os pistoqueiros mais experientes do servidor!')
      .setThumbnail(botAvatar);

    const list = leaderboard.map((user: any, index: number) => {
      const numEmoji = (Emojis as any)[`n${index + 1}`] || `**${index + 1}.**`;
      return `${numEmoji} <@${user.userId}> — Nível **${user.level}** (XP: ${user.xp.toLocaleString()})`;
    }).join('\n');

    embed.setDescription(list);
    await send({ embeds: [embed] });
  },
};
