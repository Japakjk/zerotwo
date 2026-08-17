import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { MessageService, MESSAGE_REWARDS } from '../../services/economy/MessageService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('recompensas')
    .setDescription('Exibe as recompensas por mensagens e metas no Garden.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = await this.buildEmbed(interaction.user.id, interaction.user.username, interaction.guildId!);
    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message) {
    const embed = await this.buildEmbed(message.author.id, message.author.username, message.guild!.id);
    await message.reply({ embeds: [embed] });
  },

  async buildEmbed(userId: string, username: string, guildId: string) {
    const stats = await MessageService.getStats(userId, guildId);
    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.achievement} Recompensas por Mensagens`)
      .setDescription(`• ${username} tem **${stats.messagesTotal || 0}** mensagens enviadas elegíveis.\n\n` +
        `• ${Emojis.star} Continue conversando para desbloquear coins e VIPs!`);

    MESSAGE_REWARDS.forEach(r => {
      const claimed = stats.claimedMilestones?.includes(r.count);
      const ready = (stats.messagesTotal || 0) >= r.count && !claimed;
      let statusText = `${Emojis.lock} Bloqueado`;
      if (claimed) statusText = `${Emojis.check} Resgatado`;
      if (ready) statusText = `🎉 **Disponível para resgate!**`;

      embed.addFields({
        name: `Meta: ${r.count} mensagens`,
        value: `Recompensa: ${Emojis.coin} **${r.coins.toLocaleString()} coins** + ${Emojis.vip} **${r.vipDays} dia(s) de VIP**\nStatus: ${statusText}`,
        inline: false
      });
    });
    return embed;
  },
};
