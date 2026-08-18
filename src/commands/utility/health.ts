import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { HealthService } from '../../services/core/HealthService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('health')
    .setDescription('Exibe o estado de saúde do bot e da infraestrutura.'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const snapshot = await HealthService.getSnapshot(interaction.client);
    const embed = new EmbedBuilder()
      .setColor(0x00d084)
      .setTitle('🩺 Health Check')
      .setDescription('Status geral da Zero Two e da infraestrutura conectada.')
      .addFields(
        { name: 'Discord API', value: `${snapshot.discordApiMs}ms`, inline: true },
        { name: 'WebSocket', value: snapshot.websocketState, inline: true },
        { name: 'MongoDB', value: snapshot.mongodbState, inline: true },
        { name: 'MongoDB Ping', value: snapshot.mongodbLatencyMs !== null ? `${snapshot.mongodbLatencyMs}ms` : 'N/A', inline: true },
        { name: 'Uptime', value: HealthService.formatUptime(snapshot.botUptimeMs), inline: true },
        { name: 'Memória', value: `${snapshot.memoryMb} MB`, inline: true },
        { name: 'Node', value: snapshot.nodeVersion, inline: true },
      );

    await interaction.editReply({ embeds: [embed] });
  },
};
