import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, Message } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { GuildModel } from '../../database/models/Guild.js';
import { Emojis } from '../../utils/emojis.js';

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
        .setDescription('Define os canais de logs do servidor.')
        .addStringOption(opt => 
          opt.setName('tipo')
            .setDescription('Tipo de log')
            .setRequired(true)
            .addChoices(
              { name: 'Moderação', value: 'moderation' },
              { name: 'Mensagens', value: 'messages' },
              { name: 'Membros', value: 'members' }
            )
        )
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

    let config = await GuildModel.findOne({ guildId });
    if (!config) {
      config = await GuildModel.create({ guildId });
    }

    if (sub === 'ver') {
      const embed = new ZeroTwoEmbed()
        .setTitle(`${Emojis.cat_administracao} Configurações do Garden | ${interaction.guild?.name}`)
        .setDescription(
          `• **Prefixo**: \`${config.prefix}\`\n` +
          `• **Idioma**: \`${config.language}\`\n\n` +
          `**🛡️ Moderação & Segurança**\n` +
          `• **AutoMod**: \`${config.automod?.enabled ? '✅ Ativado' : '❌ Desativado'}\`\n` +
          `• **Anti-Raid**: \`${config.antiraid?.enabled ? '✅ Ativado' : '❌ Desativado'}\`\n\n` +
          `**📜 Canais de Log**\n` +
          `• **Moderação**: ${config.logChannels?.moderation ? `<#${config.logChannels.moderation}>` : '`Não definido`'}\n` +
          `• **Mensagens**: ${config.logChannels?.messages ? `<#${config.logChannels.messages}>` : '`Não definido`'}\n` +
          `• **Membros**: ${config.logChannels?.members ? `<#${config.logChannels.members}>` : '`Não definido`'}`
        );

      await interaction.editReply({ embeds: [embed] });
    } else if (sub === 'setlog') {
      const type = interaction.options.getString('tipo', true);
      const channel = interaction.options.getChannel('canal', true);
      
      const updateObj: any = {};
      updateObj[`logChannels.${type}`] = channel.id;
      updateObj.updatedAt = new Date();

      await GuildModel.findOneAndUpdate(
        { guildId },
        { $set: updateObj },
        { upsert: true, new: true }
      );

      await interaction.editReply({
        embeds: [ZeroTwoEmbed.success('Canal de Log Definido', `• O canal de logs de **${type}** foi definido para <#${channel.id}>, Darling! ${Emojis.check}`)]
      });
    }
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ content: 'Apenas administradores podem ver as configurações, Darling!' });
    }
    
    const guildId = message.guildId!;
    let config = await GuildModel.findOne({ guildId });
    
    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.cat_administracao} Configurações do Garden`)
      .setDescription(
        `• **Prefixo**: \`${config?.prefix || 'zero!'}\`\n` +
        `• **AutoMod**: \`${config?.automod?.enabled ? '✅ Ativado' : '❌ Desativado'}\`\n\n` +
        `*Use os comandos de barra para alterar as configurações!*`
      );
      
    await message.reply({ embeds: [embed] });
  }
};
