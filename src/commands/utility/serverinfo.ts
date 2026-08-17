import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Exibe informações sobre o Garden atual.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const { guild } = interaction;
    if (!guild) return;

    const embed = new ZeroTwoEmbed()
      .setTitle(`🏰 ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: '🆔 ID', value: guild.id, inline: true },
        { name: '👑 Dono', value: `<@${guild.ownerId}>`, inline: true },
        { name: '👥 Membros', value: `${guild.memberCount}`, inline: true },
        { name: '📅 Criado em', value: `${guild.createdAt.toLocaleDateString('pt-BR')}`, inline: true }
      );

    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message) {
    const { guild } = message;
    if (!guild) return;

    const embed = new ZeroTwoEmbed()
      .setTitle(`🏰 ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: '🆔 ID', value: guild.id, inline: true },
        { name: '👑 Dono', value: `<@${guild.ownerId}>`, inline: true },
        { name: '👥 Membros', value: `${guild.memberCount}`, inline: true },
        { name: '📅 Criado em', value: `${guild.createdAt.toLocaleDateString('pt-BR')}`, inline: true }
      );

    await message.reply({ embeds: [embed] });
  },
};
