import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, ComponentType, Message, TextChannel } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Destranca um ou mais canais do servidor de forma interativa.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  deferEphemeral: true,

  async execute(interaction: ChatInputCommandInteraction) {
    await this.handleUnlockProcess(interaction, interaction.user, interaction.guild!);
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ embeds: [ZeroTwoEmbed.permissionError('Administrator')] });
    }
    await this.handleUnlockProcess(message, message.author, message.guild!);
  },

  async handleUnlockProcess(context: ChatInputCommandInteraction | Message, author: any, guild: any) {
    const isInteraction = context instanceof ChatInputCommandInteraction;

    const embed = new ZeroTwoEmbed()
      .setTitle(`🔓 Destrancar Canais | Zero Two`)
      .setDescription(`${Emojis.seta} Olá, **Darling**! Selecione abaixo no menu qual(is) canal(is) você deseja **destrancar**.\n\n` +
        `-> Apenas administradores podem interagir.`);

    const selectMenu = new ChannelSelectMenuBuilder()
      .setCustomId('channel_unlock_menu')
      .setPlaceholder('Selecione o(s) canal(is) para destrancar')
      .setMinValues(1)
      .setMaxValues(5)
      .setChannelTypes([ChannelType.GuildText]);

    const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(selectMenu);

    const response = isInteraction
      ? await context.editReply({ embeds: [embed], components: [row] })
      : await context.reply({ embeds: [embed], components: [row] });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.ChannelSelect,
      time: 300000,
      filter: i => i.isChannelSelectMenu(),
    });

    collector.on('collect', async i => {
      if (i.user.id !== author.id) {
        await i.reply({ content: `${Emojis.warning} **Darling**, apenas quem executou o comando pode usar este menu!`, ephemeral: true });
        return;
      }

      const selectedChannels = i.channels;
      const results: string[] = [];
      const failures: string[] = [];

      for (const [id] of selectedChannels) {
        const textChannel = guild.channels.cache.get(id) as TextChannel;
        if (!textChannel || textChannel.type !== ChannelType.GuildText) {
          failures.push(`<#${id}> (tipo inválido)`);
          continue;
        }

        try {
          await ModerationService.unlock(textChannel, author.id, 'Comando interativo /unlock');
          results.push(`<#${id}>`);
        } catch (err) {
          failures.push(`<#${id}>`);
          console.error('[unlock] falha ao destrancar canal:', err);
        }
      }

      const description = results.length
        ? `${Emojis.seta} Destrancados: ${results.join(', ')}`
        : `${Emojis.warning || '⚠️'} Nenhum canal foi destrancado.`;
      const resultEmbed = results.length && failures.length === 0
        ? ZeroTwoEmbed.success('Canais Destrancados', description)
        : ZeroTwoEmbed.warning('Destrancamento parcial', `${description}${failures.length ? `\n\nNão foi possível destrancar: ${failures.join(', ')}.` : ''}`);

      await i.update({ embeds: [resultEmbed], components: [] });
      collector.stop('completed');
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        const expiredEmbed = ZeroTwoEmbed.info('Menu expirado', 'O menu de canais expirou. Execute **/unlock** novamente para escolher os canais.');
        await response.edit({ embeds: [expiredEmbed], components: [] }).catch(() => {});
      }
    });
  }
};
