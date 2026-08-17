import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  ChannelType, 
  Message, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Reseta completamente o canal atual (clone e delete).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.channel;

    if (!channel || channel.type !== ChannelType.GuildText) {
      return interaction.editReply({ 
        embeds: [ZeroTwoEmbed.error('Erro de Canal', 'Este comando só pode ser usado em canais de texto, Darling!')] 
      });
    }

    const embed = ZeroTwoEmbed.warning(
      'Confirmação de Nuke', 
      `Você está prestes a **resetar completamente** o canal ${channel}. Todos os históricos de mensagens serão apagados.\n\nTem certeza que deseja continuar?`
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('nuke_confirm')
        .setLabel('Confirmar Nuke')
        .setStyle(ButtonStyle.Danger)
        .setEmoji(Emojis.ban || '💥'),
      new ButtonBuilder()
        .setCustomId('nuke_cancel')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
    );

    const response = await interaction.editReply({
      embeds: [embed],
      components: [row]
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
      filter: i => i.user.id === interaction.user.id
    });

    collector.on('collect', async i => {
      if (i.customId === 'nuke_cancel') {
        await i.update({ 
          embeds: [ZeroTwoEmbed.info('Ação Cancelada', 'O reset do canal foi cancelado, Darling! 🦖🌸')],
          components: [] 
        });
        return collector.stop();
      }

      await i.update({ content: `${Emojis.loading || '⏳'} Iniciando nuke...`, embeds: [], components: [] });

      const position = channel.position;
      const parent = channel.parentId;
      const topic = channel.topic;
      const name = channel.name;

      const newChannel = await channel.clone({
        name,
        position,
        parent,
        topic: topic || undefined
      });

      await channel.delete();

      await newChannel.send({
        embeds: [ZeroTwoEmbed.success('Canal Nuked / Resetado', `Canal resetado com sucesso por **${interaction.user.tag}**. O Garden foi limpo, Darling! 🦖🌸`)]
      });
      
      collector.stop();
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time' && collected.size === 0) {
        interaction.editReply({ 
          embeds: [ZeroTwoEmbed.error('Tempo Esgotado', 'Você demorou demais para confirmar, Darling!')],
          components: [] 
        }).catch(() => {});
      }
    });
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ embeds: [ZeroTwoEmbed.permissionError('Administrator')] });
    }

    const channel = message.channel;
    if (channel.type !== ChannelType.GuildText) return;

    const embed = ZeroTwoEmbed.warning(
      'Confirmação de Nuke', 
      `Você está prestes a **resetar completamente** este canal. Todos os históricos de mensagens serão apagados.\n\nTem certeza que deseja continuar?`
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('nuke_confirm')
        .setLabel('Confirmar Nuke')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('nuke_cancel')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
    );

    const response = await message.reply({
      embeds: [embed],
      components: [row]
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
      filter: i => i.user.id === message.author.id
    });

    collector.on('collect', async i => {
      if (i.customId === 'nuke_cancel') {
        await i.update({ 
          embeds: [ZeroTwoEmbed.info('Ação Cancelada', 'O reset do canal foi cancelado, Darling! 🦖🌸')],
          components: [] 
        });
        return collector.stop();
      }

      await i.update({ content: `${Emojis.loading || '⏳'} Iniciando nuke...`, embeds: [], components: [] });

      const position = channel.position;
      const parent = channel.parentId;
      const topic = channel.topic;
      const name = channel.name;

      const newChannel = await channel.clone({ name, position, parent, topic: topic || undefined });
      await channel.delete();

      await newChannel.send({
        embeds: [ZeroTwoEmbed.success('Canal Nuked / Resetado', `Canal resetado com sucesso por **${message.author.tag}**. O Garden foi limpo, Darling! 🦖🌸`)]
      });
      collector.stop();
    });
  }
};
