import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, Message } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { GuildModel } from '../../database/models/Guild.js';
import { Emojis } from '../../utils/emojis.js';
import { config as appConfig } from '../../config/config.js';

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
    .addSubcommand(sub =>
      sub.setName('levels')
        .setDescription('Configura o sistema de níveis do servidor.')
        .addBooleanOption(opt => opt.setName('ativado').setDescription('Ativa ou desativa o sistema de níveis'))
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal para anúncios de level-up').addChannelTypes(ChannelType.GuildText))
        .addStringOption(opt => opt.setName('mensagem').setDescription('Mensagem de level-up (Use {user} e {level})'))
        .addNumberOption(opt => opt.setName('multiplicador').setDescription('Multiplicador de XP global do servidor (ex: 1.5)'))
    )
    .addSubcommand(sub =>
      sub.setName('levels-role')
        .setDescription('Gerencia cargos por nível.')
        .addStringOption(opt => 
          opt.setName('acao')
            .setDescription('Adicionar ou remover cargo')
            .setRequired(true)
            .addChoices(
              { name: 'Adicionar', value: 'add' },
              { name: 'Remover', value: 'remove' }
            )
        )
        .addIntegerOption(opt => opt.setName('nivel').setDescription('Nível necessário').setRequired(true))
        .addRoleOption(opt => opt.setName('cargo').setDescription('Cargo a ser atribuído (obrigatório para adicionar)'))
    )
    .addSubcommand(sub =>
      sub.setName('tickets')
        .setDescription('Configura o sistema de tickets do servidor.')
        .addBooleanOption(opt => opt.setName('ativado').setDescription('Ativa ou desativa o sistema de tickets'))
        .addChannelOption(opt => opt.setName('categoria').setDescription('Categoria onde os tickets serão criados').addChannelTypes(ChannelType.GuildCategory))
        .addRoleOption(opt => opt.setName('cargo').setDescription('Cargo da equipe de suporte'))
    )
    .addSubcommand(sub =>
      sub.setName('automod')
        .setDescription('Configura o sistema de AutoMod do servidor.')
        .addBooleanOption(opt => opt.setName('ativado').setDescription('Ativa ou desativa o AutoMod global'))
        .addBooleanOption(opt => opt.setName('anti-spam').setDescription('Bloqueia mensagens rápidas'))
        .addBooleanOption(opt => opt.setName('anti-flood').setDescription('Bloqueia mensagens repetidas'))
        .addBooleanOption(opt => opt.setName('anti-links').setDescription('Bloqueia todos os links'))
        .addBooleanOption(opt => opt.setName('anti-invites').setDescription('Bloqueia convites de outros servidores'))
        .addIntegerOption(opt => opt.setName('mentions-limite').setDescription('Máximo de menções por mensagem (0 para desativar)'))
        .addIntegerOption(opt => opt.setName('repetidas-limite').setDescription('Máximo de mensagens repetidas seguidas (0 para desativar)'))
    )
    .addSubcommand(sub =>
      sub.setName('antiraid')
        .setDescription('Configura o sistema de Anti-Raid do servidor.')
        .addBooleanOption(opt => opt.setName('ativado').setDescription('Ativa ou desativa o Anti-Raid'))
        .addIntegerOption(opt => opt.setName('idade-conta').setDescription('Idade mínima da conta em dias (0 para desativar)'))
        .addIntegerOption(opt => opt.setName('limite-entradas').setDescription('Máximo de entradas permitidas (0 para desativar)'))
        .addIntegerOption(opt => opt.setName('tempo-raid').setDescription('Tempo em segundos para o limite de entradas'))
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
      let rolesList = '`Nenhum cargo definido`';
      if (config.levels.levelRoles && config.levels.levelRoles.size > 0) {
        const entries = Array.from(config.levels.levelRoles.entries()) as [string, string][];
        rolesList = entries
          .map(([lvl, id]) => `• Nível **${lvl}**: <@&${id}>`)
          .join('\n');
      }

      const embed = new ZeroTwoEmbed()
        .setTitle(`${Emojis.cat_administracao} Configurações do Garden | ${interaction.guild?.name}`)
        .setDescription(
          `• **Prefixo**: \`${config.prefix}\`\n` +
          `• **Idioma**: \`${config.language}\`\n\n` +
          `**🛡️ AutoMod & Segurança**\n` +
          `• **Status**: \`${config.automod?.enabled ? '✅ Ativado' : '❌ Desativado'}\`\n` +
          `• **Anti-Spam**: \`${config.automod?.antiSpam ? '✅' : '❌'}\` | **Anti-Flood**: \`${config.automod?.antiFlood ? '✅' : '❌'}\`\n` +
          `• **Anti-Links**: \`${config.automod?.antiLinks ? '✅' : '❌'}\` | **Anti-Invites**: \`${config.automod?.antiInvites ? '✅' : '❌'}\`\n` +
          `• **Limite Menções**: \`${config.automod?.antiMentions || 'Desativado'}\` | **Limite Repetidas**: \`${config.automod?.maxRepeated || 'Desativado'}\`\n\n` +
          `**🚨 Anti-Raid**\n` +
          `• **Status**: \`${config.antiraid?.enabled ? '✅ Ativado' : '❌ Desativado'}\`\n` +
          `• **Idade Mínima**: \`${config.antiraid?.accountAge || 0} dias\`\n` +
          `• **Limite Entrada**: \`${config.antiraid?.massJoinLimit || 0} em ${config.antiraid?.massJoinTime}s\`\n\n` +
          `**⭐ Sistema de Níveis**\n` +
          `• **Status**: \`${config.levels?.enabled ? '✅ Ativado' : '❌ Desativado'}\`\n` +
          `• **Multiplicador**: \`${config.levels?.xpMultiplier}x\`\n` +
          `• **Canal**: ${config.levels?.channelId ? `<#${config.levels.channelId}>` : '`Canal Atual`'}\n` +
          `**Cargos por Nível:**\n${rolesList}\n\n` +
          `**🎫 Sistema de Tickets**\n` +
          `• **Status**: \`${config.tickets?.enabled ? '✅ Ativado' : '❌ Desativado'}\`\n` +
          `• **Categoria**: ${config.tickets?.categoryId ? `<#${config.tickets.categoryId}>` : '`Não definida`'}\n` +
          `• **Cargo Suporte**: ${config.tickets?.supportRoleId ? `<@&${config.tickets.supportRoleId}>` : '`Não definido`'}\n\n` +
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
    } else if (sub === 'levels') {
      const enabled = interaction.options.getBoolean('ativado');
      const channel = interaction.options.getChannel('canal');
      const message = interaction.options.getString('mensagem');
      const multiplier = interaction.options.getNumber('multiplicador');

      if (enabled !== null) config.levels.enabled = enabled;
      if (channel) config.levels.channelId = channel.id;
      if (message) config.levels.message = message;
      if (multiplier !== null) config.levels.xpMultiplier = multiplier;

      await config.save();
      await interaction.editReply({
        embeds: [ZeroTwoEmbed.success('Sistema de Níveis Atualizado', `As configurações de níveis foram atualizadas com sucesso, Darling! ${Emojis.check}`)]
      });
    } else if (sub === 'levels-role') {
      const action = interaction.options.getString('acao', true);
      const level = interaction.options.getInteger('nivel', true);
      const role = interaction.options.getRole('cargo');

      if (action === 'add') {
        if (!role) return interaction.editReply({ content: `${Emojis.ban} Você precisa especificar um cargo para adicionar!` });
        if (!config.levels.levelRoles) config.levels.levelRoles = new Map();
        config.levels.levelRoles.set(level.toString(), role.id);
      } else {
        if (config.levels.levelRoles) config.levels.levelRoles.delete(level.toString());
      }

      await config.save();
      await interaction.editReply({
        embeds: [ZeroTwoEmbed.success('Cargos por Nível Atualizados', `O cargo para o nível **${level}** foi ${action === 'add' ? 'adicionado' : 'removido'} com sucesso! ${Emojis.check}`)]
      });
    } else if (sub === 'tickets') {
      const enabled = interaction.options.getBoolean('ativado');
      const category = interaction.options.getChannel('categoria');
      const role = interaction.options.getRole('cargo');

      if (enabled !== null) config.tickets.enabled = enabled;
      if (category) config.tickets.categoryId = category.id;
      if (role) config.tickets.supportRoleId = role.id;

      await config.save();
      await interaction.editReply({
        embeds: [ZeroTwoEmbed.success('Sistema de Tickets Atualizado', `As configurações de tickets foram atualizadas com sucesso, Darling! ${Emojis.check}`)]
      });
    } else if (sub === 'automod') {
      const enabled = interaction.options.getBoolean('ativado');
      const antiSpam = interaction.options.getBoolean('anti-spam');
      const antiFlood = interaction.options.getBoolean('anti-flood');
      const antiLinks = interaction.options.getBoolean('anti-links');
      const antiInvites = interaction.options.getBoolean('anti-invites');
      const antiMentions = interaction.options.getInteger('mentions-limite');
      const maxRepeated = interaction.options.getInteger('repetidas-limite');

      if (enabled !== null) config.automod.enabled = enabled;
      if (antiSpam !== null) config.automod.antiSpam = antiSpam;
      if (antiFlood !== null) config.automod.antiFlood = antiFlood;
      if (antiLinks !== null) config.automod.antiLinks = antiLinks;
      if (antiInvites !== null) config.automod.antiInvites = antiInvites;
      if (antiMentions !== null) config.automod.antiMentions = antiMentions;
      if (maxRepeated !== null) config.automod.maxRepeated = maxRepeated;

      await config.save();
      await interaction.editReply({
        embeds: [ZeroTwoEmbed.success('AutoMod Atualizado', `As configurações do AutoMod foram atualizadas com sucesso, Darling! ${Emojis.check}`)]
      });
    } else if (sub === 'antiraid') {
      const enabled = interaction.options.getBoolean('ativado');
      const accountAge = interaction.options.getInteger('idade-conta');
      const massJoinLimit = interaction.options.getInteger('limite-entradas');
      const massJoinTime = interaction.options.getInteger('tempo-raid');

      if (enabled !== null) config.antiraid.enabled = enabled;
      if (accountAge !== null) config.antiraid.accountAge = accountAge;
      if (massJoinLimit !== null) config.antiraid.massJoinLimit = massJoinLimit;
      if (massJoinTime !== null) config.antiraid.massJoinTime = massJoinTime;

      await config.save();
      await interaction.editReply({
        embeds: [ZeroTwoEmbed.success('Anti-Raid Atualizado', `As configurações de Anti-Raid foram atualizadas com sucesso, Darling! ${Emojis.check}`)]
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
        `• **Prefixo**: \`${config?.prefix || appConfig.DEFAULT_PREFIX}\`\n` +
        `• **AutoMod**: \`${config?.automod?.enabled ? '✅ Ativado' : '❌ Desativado'}\`\n\n` +
        `*Use os comandos de barra para alterar as configurações!*`
      );
      
    await message.reply({ embeds: [embed] });
  }
};
