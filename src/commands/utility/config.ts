import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { GuildConfigModel } from '../../database/models/GuildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Gerencie as configurações do Garden e canais de log.')
    .addSubcommand(sub =>
      sub.setName('ver')
        .setDescription('Exibe as configurações atuais do servidor.')
    )
    .addSubcommand(sub =>
      sub.setName('setlog')
        .setDescription('Define o canal de logs de moderação.')
        .addChannelOption(opt =>
          opt.setName('canal')
            .setDescription('Canal de texto para os logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    let config = await GuildConfigModel.findOne({ guildId });
    if (!config) {
      config = await GuildConfigModel.create({ guildId });
    }

    if (sub === 'ver') {
      const embed = new ZeroTwoEmbed()
        .setTitle(`⚙️ Configurações do Garden | ${interaction.guild?.name}`)
        .setDescription(
          `• **Prefixo**: \`${config.prefix}\`\n` +
          `• **Idioma**: \`${config.language}\`\n` +
          `• **Canal de ModLog**: ${config.logChannels?.moderation ? `<#${config.logChannels.moderation}>` : 'Não definido'}\n` +
          `• **Anti-Raid**: \`${config.antiraid.enabled ? 'Ativado' : 'Desativado'}\`\n` +
          `• **Anti-Invite**: \`${config.automod.antiInvite ? 'Ativado' : 'Desativado'}\``
        );

      await interaction.editReply({ embeds: [embed] });
    } else if (sub === 'setlog') {
      const channel = interaction.options.getChannel('canal', true);
      await GuildConfigModel.findOneAndUpdate(
        { guildId },
        { $set: { 'logChannels.moderation': channel.id, updatedAt: new Date() } },
        { upsert: true, new: true }
      );

      await interaction.editReply({
        embeds: [ZeroTwoEmbed.success('Canal de Log Definido', `• O canal de logs de moderação foi definido para <#${channel.id}>, Darling!`)]
      });
    }
  },
};
