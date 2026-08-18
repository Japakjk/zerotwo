import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, ComponentType, ChatInputCommandInteraction as CommandInteraction } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lock-unlock')
    .setDescription('Gerenciamento de trancamento de canais do Garden.')
    .addSubcommand(sub =>
      sub.setName('lock')
        .setDescription('Tranca um ou mais canais do servidor.')
    )
    .addSubcommand(sub =>
      sub.setName('unlock')
        .setDescription('Destranca um ou mais canais do servidor.')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const isLock = sub === 'lock';

    const embed = new ZeroTwoEmbed()
      .setTitle(`🔒 ${isLock ? 'Trancar' : 'Destrancar'} Canais | Zero Two`)
      .setDescription(`• Olá, Darling! Selecione abaixo no menu qual(is) canal(is) você deseja **${isLock ? 'trancar' : 'destrancar'}**.\n\n` +
        `-> Apenas você pode ver esta mensagem.`);

    const selectMenu = new ChannelSelectMenuBuilder()
      .setCustomId(`channel_${sub}_menu`)
      .setPlaceholder(`Selecione o(s) canal(is) para ${isLock ? 'trancar' : 'destrancar'}`)
      .setMinValues(1)
      .setMaxValues(5)
      .setChannelTypes([ChannelType.GuildText]);

    const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(selectMenu);

    const response = await interaction.editReply({ embeds: [embed], components: [row] });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.ChannelSelect,
      time: 60000
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({ content: 'Apenas o administrador que executou o comando pode usar este menu!', ephemeral: true });
        return;
      }

      const selectedChannels = i.channels;
      const results: string[] = [];

      for (const [id, channelObj] of selectedChannels) {
        const textChannel = interaction.guild?.channels.cache.get(id);
        if (textChannel && textChannel.type === ChannelType.GuildText) {
          try {
            await textChannel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
              SendMessages: isLock ? false : null
            });
            results.push(`<#${id}>`);
          } catch (err) {
            console.error(err);
          }
        }
      }

      const successEmbed = new ZeroTwoEmbed()
        .setTitle(`🌸 Canais ${isLock ? 'Trancados' : 'Destrancados'}`)
        .setDescription(`• Os seguintes canais foram ${isLock ? 'trancados' : 'destrancados'} com sucesso:\n\n${results.join(', ')}`);

      await i.update({ embeds: [successEmbed], components: [] });
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });
  },
};
