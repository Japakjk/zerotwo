import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, ComponentType, Message } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Tranca um ou mais canais do servidor.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.lock || '🔒'} Trancar Canais | Zero Two`)
      .setDescription(`${Emojis.seta} Olá, **Darling**! Selecione abaixo no menu qual(is) canal(is) você deseja **trancar**.\n\n` +
        `-> Apenas você pode ver esta mensagem.`);

    const selectMenu = new ChannelSelectMenuBuilder()
      .setCustomId('channel_lock_menu')
      .setPlaceholder('Selecione o(s) canal(is) para trancar')
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
        await i.reply({ content: `${Emojis.warning} **Darling**, apenas o administrador que executou o comando pode usar este menu!`, ephemeral: true });
        return;
      }

      const selectedChannels = i.channels;
      const results: string[] = [];

      for (const [id, channelObj] of selectedChannels) {
        const textChannel = interaction.guild?.channels.cache.get(id) as any;
        if (textChannel && textChannel.type === ChannelType.GuildText) {
          try {
            await textChannel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
              SendMessages: false
            });
            results.push(`<#${id}>`);
          } catch (err) {
            console.error(err);
          }
        }
      }

      const successEmbed = new ZeroTwoEmbed()
        .setTitle(`${Emojis.check} Canais Trancados`)
        .setDescription(`${Emojis.seta} Os seguintes canais foram **trancados** com sucesso:\n\n${results.join(', ')}`);

      await i.update({ embeds: [successEmbed], components: [] });
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    
    const channel = message.mentions.channels.first() || message.channel;
    if (channel.type !== ChannelType.GuildText) return;

    try {
      await (channel as any).permissionOverwrites.edit(message.guild!.roles.everyone, {
        SendMessages: false
      });
      await message.reply({ embeds: [ZeroTwoEmbed.success('Canal Trancado', `Este canal foi trancado com sucesso, **Darling**! ${Emojis.lock}`)] });
    } catch (err) {
      await message.reply({ content: 'Não consegui trancar este canal.' });
    }
  }
};
