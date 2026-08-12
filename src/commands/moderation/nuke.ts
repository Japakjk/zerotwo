import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

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
};
