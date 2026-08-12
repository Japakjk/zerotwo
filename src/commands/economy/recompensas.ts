import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { MessageService, MESSAGE_REWARDS } from '../../services/economy/MessageService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('recompensas')
    .setDescription('Exibe as recompensas por mensagens e metas no Garden.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const stats = await MessageService.getStats(interaction.user.id, interaction.guildId!);

    const embed = new ZeroTwoEmbed()
      .setTitle(`🎁 Recompensas por Mensagens`)
      .setDescription(`• ${interaction.user.username} tem **${stats.messagesTotal || 0}** mensagens enviadas elegíveis.\n\n` +
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

    await interaction.editReply({ embeds: [embed] });
  },
};
