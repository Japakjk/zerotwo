import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Message, TextChannel } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Define o modo lento para o canal atual.')
    .addIntegerOption(opt => opt.setName('segundos').setDescription('Tempo em segundos (0 para desativar)').setRequired(true).setMinValue(0).setMaxValue(21600))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction: ChatInputCommandInteraction) {
    const seconds = interaction.options.getInteger('segundos', true);
    const channel = interaction.channel as TextChannel;

    try {
      await channel.setRateLimitPerUser(seconds);
      
      const action = seconds === 0 ? 'Desativado' : `${seconds} segundos`;
      await ModerationService.createCase(interaction.guild!, 'channel', interaction.user.id, 'slowmode', `Modo lento definido para ${action} em ${channel.name}`);

      const embed = ZeroTwoEmbed.success('Modo Lento Atualizado', `${Emojis.check} O modo lento deste canal agora é de **${action}**, Darling!`);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[slowmode] falha ao alterar rate limit', { guildId: interaction.guildId, channelId: channel.id, seconds, error });
      await interaction.editReply({ embeds: [ZeroTwoEmbed.error('Modo lento não atualizado', 'O Discord recusou a alteração. Verifique se eu tenho `ManageChannels` neste canal.') ] });
    }
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ embeds: [ZeroTwoEmbed.permissionError('ManageChannels')] });
    }

    const seconds = parseInt(args[0]);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
      return message.reply({ content: 'Forneça um tempo válido em segundos (0-21600)!' });
    }

    const channel = message.channel as TextChannel;
    try {
      await channel.setRateLimitPerUser(seconds);
      await message.reply({ content: `${Emojis.check} Modo lento definido para **${seconds}s**!` });
    } catch (error) {
      console.error('[slowmode] falha ao alterar rate limit por prefixo', { guildId: message.guildId, channelId: channel.id, seconds, error });
      await message.reply({ embeds: [ZeroTwoEmbed.error('Modo lento não atualizado', 'O Discord recusou a alteração. Verifique `ManageChannels` neste canal.') ] });
    }
  }
};
