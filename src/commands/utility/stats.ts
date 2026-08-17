import { SlashCommandBuilder, ChatInputCommandInteraction, Message, version as djsVersion } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { StatsService, IBotMetrics } from '../../services/utility/StatsService.js';
import os from 'os';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Exibe estatísticas globais da Zero Two e do sistema.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const stats: IBotMetrics = await StatsService.getStats();
    const uptime = process.uptime();
    
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor(uptime / 3600) % 24;
    const minutes = Math.floor(uptime / 60) % 60;
    const uptimeStr = `${days}d ${hours}h ${minutes}m`;

    const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

    // Ordenar comandos mais usados
    const topCommands = Array.from(stats.commandUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], i) => `**${i + 1}.** \`/${name}\`: ${count}`)
      .join('\n') || 'Nenhum comando registrado.';

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.cat_utilidades} Estatísticas do Garden`)
      .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
      .addFields(
        { name: '📊 Bot Metrics', value: 
          `• **Servidores:** ${interaction.client.guilds.cache.size}\n` +
          `• **Usuários:** ${interaction.client.users.cache.size}\n` +
          `• **Mensagens:** ${stats.totalMessages.toLocaleString()}\n` +
          `• **Comandos:** ${stats.totalCommands.toLocaleString()}\n` +
          `• **Erros:** ${stats.totalErrors}`, inline: true 
        },
        { name: '⚙️ System', value: 
          `• **Uptime:** \`${uptimeStr}\`\n` +
          `• **RAM:** \`${ramUsage}MB / ${totalRam}GB\`\n` +
          `• **Node:** \`${process.version}\`\n` +
          `• **D.JS:** \`v${djsVersion}\`\n` +
          `• **Ping:** \`${interaction.client.ws.ping}ms\``, inline: true 
        },
        { name: '🔥 Top Comandos', value: topCommands, inline: false }
      );

    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message) {
    const stats: IBotMetrics = await StatsService.getStats();
    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.cat_utilidades} Status da Zero Two`)
      .setDescription(
        `• **Servidores:** ${message.client.guilds.cache.size}\n` +
        `• **Mensagens:** ${stats.totalMessages.toLocaleString()}\n` +
        `• **Comandos:** ${stats.totalCommands.toLocaleString()}\n` +
        `• **Latência:** ${message.client.ws.ping}ms`
      );
    await message.reply({ embeds: [embed] });
  }
};
