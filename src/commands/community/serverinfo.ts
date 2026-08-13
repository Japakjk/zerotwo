import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Exibe informações detalhadas do servidor atual.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    const owner = await guild.fetchOwner();

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.achievement} Informações do Garden — ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: `${Emojis.rank} Dono(a)`, value: `<@${owner.id}>`, inline: true },
        { name: `${Emojis.coin} Membros`, value: `**${guild.memberCount}** Darlings`, inline: true },
        { name: `${Emojis.clock} Criado em`, value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: `${Emojis.seta} Cargos`, value: `**${guild.roles.cache.size}** cargos`, inline: true },
        { name: `${Emojis.seta_menor} Canais`, value: `**${guild.channels.cache.size}** canais`, inline: true }
      )
      .setFooter({ text: `ID do Servidor: ${guild.id}` });

    await interaction.editReply({ embeds: [embed] });
  },
};
