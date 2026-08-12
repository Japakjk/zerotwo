import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { MessageService } from '../../services/economy/MessageService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { MESSAGE_REWARDS } from '../../services/economy/MessageService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mensagens')
    .setDescription('Exibe a contagem de mensagens enviadas por você ou por outro Darling.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O Darling para inspecionar')),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const stats = await MessageService.getStats(target.id, interaction.guildId!);

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.cat_utilidades} Contagem de mensagens de ${target.username}`)
      .setDescription(`• **Mensagens enviadas em ${interaction.guild?.name || 'Garden'}:**\n` +
        `  ${Emojis.seta_menor} Hoje: **${stats.messagesToday || 0}**\n` +
        `  ${Emojis.seta_menor} Essa Semana: **${stats.messagesWeek || 0}**\n` +
        `  ${Emojis.seta_menor} Esse Mês: **${stats.messagesMonth || 0}**\n` +
        `  ${Emojis.seta_menor} Total: **${stats.messagesTotal || 0}**`)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: `Utilize ${Emojis.seta_menor} /recompensas para ver as recompensas por mensagens.` });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('view_rewards')
        .setLabel('Ver recompensas por mensagens')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(Emojis.achievement)
    );

    const response = await interaction.editReply({ embeds: [embed], components: [row] });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({ content: 'Apenas o autor do comando pode interagir com estes botões, Darling!', ephemeral: true });
        return;
      }

      if (i.customId === 'view_rewards') {
        const rewardEmbed = new ZeroTwoEmbed()
          .setTitle(`${Emojis.achievement} Recompensas por Mensagens`)
          .setDescription(`• ${target.username} tem **${stats.messagesTotal || 0}** mensagens enviadas elegíveis para as recompensas.\n\n` +
            `  ${Emojis.seta_menor} A cada **300** mensagens, você recebe ${Emojis.coin} **1,000,000 coins** e ${Emojis.vip} **Dias de VIP**!\n` +
            `  ${Emojis.warning} O spam não é contabilizado para evitar abusos.`);

        MESSAGE_REWARDS.forEach(r => {
          const claimed = stats.claimedMilestones?.includes(r.count);
          rewardEmbed.addFields({
            name: `${Emojis.seta} Meta: ${r.count} mensagens`,
            value: `${claimed ? Emojis.check : Emojis.lock} **${r.coins.toLocaleString()} coins** + **${r.vipDays} dia(s) de VIP** ${claimed ? '(Resgatado)' : ''}`,
            inline: false
          });
        });

        await i.update({ embeds: [rewardEmbed], components: [] });
      }
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });
  },
};
