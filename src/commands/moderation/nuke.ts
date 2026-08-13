import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, Message } from 'discord.js';
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
      return interaction.editReply({ content: 'Este comando só pode ser usado em canais de texto, Darling!' });
    }

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
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;

    const channel = message.channel;
    if (channel.type !== ChannelType.GuildText) return;

    const position = channel.position;
    const parent = channel.parentId;
    const topic = channel.topic;
    const name = channel.name;

    const newChannel = await channel.clone({ name, position, parent, topic: topic || undefined });
    await channel.delete();

    await newChannel.send({
      content: `${Emojis.check} Canal resetado com sucesso, **Darling**! 🦖🌸`
    });
  }
};
