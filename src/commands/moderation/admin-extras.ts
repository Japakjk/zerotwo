import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Comandos administrativos e de gerenciamento do servidor.')
    .addSubcommand(sub =>
      sub.setName('nuke')
        .setDescription('Reseta completamente o canal atual.')
    )
    .addSubcommand(sub =>
      sub.setName('lock')
        .setDescription('Tranca o canal atual para @everyone.')
    )
    .addSubcommand(sub =>
      sub.setName('unlock')
        .setDescription('Destranca o canal atual para @everyone.')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const channel = interaction.channel;

    if (!channel || channel.type !== ChannelType.GuildText) {
      return interaction.editReply({ content: 'Este comando só pode ser usado em canais de texto, Darling!' });
    }

    if (sub === 'nuke') {
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
        embeds: [ZeroTwoEmbed.success('Canal Resetado (Nuke)', `Canal resetado com sucesso por **${interaction.user.tag}**. O Garden está limpo, Darling! 🦖🌸`)]
      });
    } else if (sub === 'lock') {
      await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: false });
      await interaction.editReply({
        embeds: [ZeroTwoEmbed.success('Canal Trancado', `Este canal foi trancado. Ninguém mais passa sem permissão, Darling!`)]
      });
    } else if (sub === 'unlock') {
      await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: null });
      await interaction.editReply({
        embeds: [ZeroTwoEmbed.success('Canal Destrancado', `Este canal foi destrancado. As portas do Garden estão abertas!`)]
      });
    }
  },
};
