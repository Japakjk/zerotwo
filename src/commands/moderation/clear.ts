import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  TextChannel, 
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Limpa mensagens do canal atual.')
    .addIntegerOption(opt => opt.setName('quantidade').setDescription('Número de mensagens (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(opt => opt.setName('usuario').setDescription('Apagar apenas mensagens deste usuário').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('quantidade', true);
    const target = interaction.options.getUser('usuario');
    const channel = interaction.channel as TextChannel;

    if (!channel || !channel.bulkDelete) {
      return interaction.editReply({ 
        embeds: [ZeroTwoEmbed.error('Erro de Canal', 'Não posso limpar mensagens neste tipo de canal, Darling!')] 
      });
    }

    // Confirmação para quantidades grandes (> 50) sem filtro de usuário
    if (amount > 50 && !target) {
      const confirmEmbed = ZeroTwoEmbed.warning(
        'Confirmação de Limpeza',
        `Você está prestes a apagar **${amount}** mensagens. Deseja continuar?`
      );

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('clear_confirm').setLabel('Confirmar').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('clear_cancel').setLabel('Cancelar').setStyle(ButtonStyle.Secondary)
      );

      const response = await interaction.editReply({ embeds: [confirmEmbed], components: [row] });
      
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 15000,
        filter: i => i.user.id === interaction.user.id
      });

      collector.on('collect', async i => {
        if (i.customId === 'clear_cancel') {
          await i.update({ embeds: [ZeroTwoEmbed.info('Cancelado', 'Limpeza cancelada, Darling! 🦖🌸')], components: [] });
          return collector.stop();
        }
        await i.deferUpdate();
        await this.performClear(interaction, amount, target, channel);
        collector.stop();
      });
      return;
    }

    await this.performClear(interaction, amount, target, channel);
  },

  async performClear(interaction: ChatInputCommandInteraction, amount: number, target: any, channel: TextChannel) {
    try {
      let messages = await channel.messages.fetch({ limit: amount });
      
      if (target) {
        messages = messages.filter(m => m.author.id === target.id);
      }

      const deleted = await channel.bulkDelete(messages, true);
      await ModerationService.createCase(interaction.guild!, 'channel', interaction.user.id, 'clear', `Limpeza de ${deleted.size} mensagens em ${channel.name}${target ? ` do usuário ${target.tag}` : ''}`);
      
      const embed = ZeroTwoEmbed.success(
        'Limpeza Concluída',
        `A Zero Two varreu **${deleted.size}** mensagens para debaixo do tapete! 🦖🌸`
      ).setFooter({ text: 'Esta mensagem se auto-destruirá em 5 segundos.' });

      await interaction.editReply({ embeds: [embed], components: [] });
      setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
    } catch (err) {
      console.error('[clear] falha ao apagar mensagens', {
        guildId: interaction.guildId,
        channelId: channel.id,
        amount,
        targetId: target?.id,
        error: err
      });
      await interaction.editReply({
        embeds: [ZeroTwoEmbed.error('Limpeza não concluída', 'O Discord recusou a exclusão. Verifique se as mensagens têm menos de 14 dias e se eu mantenho `ManageMessages` neste canal.')],
        components: []
      });
    }
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply({ embeds: [ZeroTwoEmbed.permissionError('ManageMessages')] });
    }

    const isCl = message.content.toLowerCase().includes('cl');
    const channel = message.channel as TextChannel;

    if (isCl) {
      try {
        const messages = await channel.messages.fetch({ limit: 100 });
        const userMessages = messages.filter(m => m.author.id === message.author.id);
        const deleted = await channel.bulkDelete(userMessages, true);
        const msg = await channel.send({ content: `${Emojis.check} Limpeza pessoal: **${deleted.size}** mensagens suas foram apagadas, Darling! 🌸` });
        setTimeout(() => msg.delete().catch(() => {}), 5000);
      } catch (error) {
        console.error('[clear] falha na limpeza pessoal', { guildId: message.guildId, channelId: channel.id, userId: message.author.id, error });
        await message.reply({ content: `${Emojis.ban} **Não consegui apagar suas mensagens.** Verifique se elas têm menos de 14 dias e se eu posso gerenciar mensagens neste canal.` });
      }
      return;
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply({ content: 'Forneça uma quantidade entre 1 e 100, Darling!' });
    }

    try {
      await message.delete().catch(() => {});
      const deleted = await channel.bulkDelete(amount, true);
      const msg = await channel.send({ content: `${Emojis.check} **${deleted.size}** mensagens limpas com sucesso! 🦖🌸` });
      setTimeout(() => msg.delete().catch(() => {}), 5000);
    } catch (error) {
      console.error('[clear] falha na limpeza do canal', { guildId: message.guildId, channelId: channel.id, amount, error });
      await message.reply({ content: `${Emojis.ban} **A limpeza não foi concluída.** Verifique a idade das mensagens e a permissão \`ManageMessages\` neste canal.` });
    }
  }
};
