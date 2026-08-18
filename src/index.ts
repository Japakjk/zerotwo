import { Client, GatewayIntentBits, Collection, REST, Routes, MessageFlags, TextChannel, Message } from 'discord.js';
import fs from 'fs';
import { config } from './config/config.js';
import path from 'path';
import { connectDatabase } from './database/database.js';
import { logger } from './utils/logger.js';
import { UserModel } from './database/models/User.js';
import { GuildModel } from './database/models/Guild.js';
import { LevelService } from './services/leveling/LevelService.js';
import { AchievementService } from './services/leveling/AchievementService.js';
import { LoggingService } from './services/logging/LoggingService.js';
import { AutoModService } from './services/automod/AutoModService.js';
import { CooldownService } from './services/economy/CooldownService.js';
import { MessageService } from './services/economy/MessageService.js';
import { DashboardService } from './services/dashboard/DashboardService.js';
import { ZeroTwoEmbed } from './utils/embeds.js';
import { Emojis } from './utils/emojis.js';
import { GiveawayService } from './services/utility/GiveawayService.js';
import { TicketService } from './services/utility/TicketService.js';
import { MaintenanceService } from './services/utility/MaintenanceService.js';
import { CronService } from './services/utility/CronService.js';
import { StatsService } from './services/utility/StatsService.js';
import { sayEmbedSessions, getSayEmbedPanel, clearSayEmbedSession } from './commands/moderation/sayembed.js';
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType } from 'discord.js';
import ms from 'ms';

// dotenv já inicializado e validado no config centralizado

process.on('unhandledRejection', (error) => {
  logger.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
});

function describeError(error: unknown): { message: string; stack: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack || 'stack indisponível' };
  }
  return { message: String(error), stack: 'stack indisponível' };
}

function logInteractionFailure(interaction: any, commandName: string, operation: string, error: unknown, context?: string): void {
  const details = describeError(error);
  const customId = typeof interaction.customId === 'string' ? interaction.customId : 'none';
  logger.error(
    `[InteractionError] command=${commandName} interactionType=${interaction.type} guildId=${interaction.guildId || 'dm'} channelId=${interaction.channelId || 'none'} userId=${interaction.user?.id || 'unknown'} customId=${customId} operation=${operation} context=${context || 'none'} error=${details.message} stack=${details.stack}`
  );
}

// O tsconfig inclui `src/` dentro de `dist/`; o runtime inicia em `dist/src/index.js`.
const __dirname = path.join(process.cwd(), 'dist', 'src');

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function validateSayEmbedInput(field: string, value: string, guild: any): string | null {
  const trimmed = value.trim();
  if (field === 'content' && (trimmed.length < 1 || trimmed.length > 2000)) return 'A mensagem deve ter entre 1 e 2.000 caracteres.';
  if (field === 'title' && (trimmed.length < 1 || trimmed.length > 256)) return 'O título deve ter entre 1 e 256 caracteres.';
  if (field === 'desc' && (trimmed.length < 1 || trimmed.length > 4096)) return 'A descrição deve ter entre 1 e 4.096 caracteres.';
  if (field === 'footer' && (trimmed.length < 1 || trimmed.length > 2048)) return 'O rodapé deve ter entre 1 e 2.048 caracteres.';
  if (field === 'color' && !/^#[0-9a-f]{6}$/i.test(trimmed)) return 'A cor deve estar no formato HEX, por exemplo: `#ff3b69`.';
  if ((field === 'image' || field === 'thumbnail') && trimmed && !isSafeHttpUrl(trimmed)) return 'Informe uma URL HTTP ou HTTPS válida.';
  if (field === 'reaction' && (trimmed.length < 1 || trimmed.length > 100 || /\s/.test(trimmed))) return 'Informe um emoji válido, sem espaços.';
  return null;
}

export interface ExtendedClient extends Client {
  commands: Collection<string, any>;
}

const client = (new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
})) as ExtendedClient;

client.commands = new Collection();

// Carregador de Comandos
async function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js') && !file.endsWith('.d.ts') && !file.endsWith('.map'));
    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const command = await import(`file://${filePath}`);
      if ('default' in command && command.default.data) {
        (command.default as any).category = category;
        client.commands.set(command.default.data.name, command.default);
        logger.info(`🌸 [COMMAND] Carregado: ${command.default.data.name} (${category})`);
      }
    }
  }
}

// Evento Ready
client.once('clientReady', async (readyClient) => {
  logger.info(`🌸 [DARLING-BOT] Logado com sucesso como ${readyClient.user?.tag}! A ${readyClient.user?.username || 'Loirinha'} está pronta.`);
  
  readyClient.user?.setPresence({
    activities: [{ name: 'Procurando meu Darling 🦖❤️', type: 0 }],
    status: 'online',
  });

  // Sincronizar guildas com o Dashboard Web
  for (const guild of readyClient.guilds.cache.values()) {
    try {
      const synced = await DashboardService.syncGuild(guild);
      if (synced) {
        logger.info(`[DashboardBridge] Guilda sincronizada: ${guild.name} (${guild.id})`);
      } else {
        logger.warn(`[DashboardBridge] Guilda não sincronizada: ${guild.name} (${guild.id})`);
      }
    } catch (err: any) {
      logger.error(`[DashboardBridge] Falha ao sincronizar ${guild.id}:`, err.message);
    }
  }
});

// Evento de Nova Guilda
client.on('guildCreate', async (guild) => {
  try {
    const synced = await DashboardService.syncGuild(guild);
    if (synced) {
      logger.info(`[DashboardBridge] Nova guilda sincronizada: ${guild.name} (${guild.id})`);
    } else {
      logger.warn(`[DashboardBridge] Nova guilda não sincronizada: ${guild.name} (${guild.id})`);
    }
  } catch (err: any) {
    logger.error(`[DashboardBridge] Falha ao sincronizar nova guilda ${guild.id}:`, err.message);
  }
});

// Cache de Guildas (5 minutos)
const guildCache = new Map<string, { data: any; timestamp: number }>();

async function getGuildConfig(guildId: string) {
  const cached = guildCache.get(guildId);
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.data;
  }
  const guildDb = await GuildModel.findOne({ guildId });
  if (guildDb) {
    guildCache.set(guildId, { data: guildDb, timestamp: Date.now() });
  }
  return guildDb;
}

const PANEL_COMMANDS = new Set(['help', 'lock', 'unlock', 'sayembed', 'sorteio', 'zlogs', 'ticket', 'maintenance']);

function getTextCleanupDelay(command: any, commandName: string): number | null {
  if (commandName === 'help') return 180000;
  if (PANEL_COMMANDS.has(commandName)) return 300000;
  if (command?.category === 'moderation' || command?.category === 'owner') return 60000;
  return null;
}

function scheduleMessageCleanup(userMessage: any, botMessages: any[], delayMs: number): void {
  const timer = setTimeout(() => {
    const messages = [userMessage, ...botMessages].filter(Boolean);
    void Promise.allSettled(messages.map((msg: any) => {
      if (!msg?.deletable || typeof msg.delete !== 'function') return Promise.resolve();
      return msg.delete().catch(() => undefined);
    }));
  }, delayMs);
  timer.unref?.();
}

// Evento de Mensagem para XP, AutoMod, Prefixos e Mensagens
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  StatsService.registerMessage();

  // Performance: Buscar config e usuário uma única vez
  const guildDb = await getGuildConfig(message.guild.id);
  let userDb = await UserModel.findOne({ userId: message.author.id, guildId: message.guild.id });
  
  if (!userDb) {
    userDb = await UserModel.create({ userId: message.author.id, guildId: message.guild.id });
  }

  // Buscar prefixo
  const customPrefix = guildDb?.prefix || config.DEFAULT_PREFIX;
  const prefixes = [...new Set([customPrefix, config.DEFAULT_PREFIX, 'zero!', '/'])];
  const prefix = prefixes.find(p => message.content.toLowerCase().startsWith(p.toLowerCase()));

  if (prefix) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (commandName) {
      let resolvedCommandName = commandName;
      if (commandName === 's') resolvedCommandName = 'saldo';
      if (commandName === 'cl') resolvedCommandName = 'clear';
      if (commandName === 'c') resolvedCommandName = 'config';

      const command = client.commands.get(resolvedCommandName);
      if (command) {
        // Check Maintenance & Disabled Commands (Owner bypass)
        const maintenance = await MaintenanceService.checkMaintenance();
        const OWNER_ID = config.OWNER_ID;
        
        if (message.author.id !== OWNER_ID) {
          if (maintenance.enabled && resolvedCommandName !== 'maintenance') {
            const mEmbed = new ZeroTwoEmbed()
              .setTitle('🛠️ Garden em Manutenção')
              .setDescription(`Desculpe, Darling! O Garden está passando por melhorias no momento.\n\n**Motivo:** ${maintenance.reason}\n\n*Por favor, tente novamente mais tarde!* 🦖🌸`)
              .setColor('#f1c40f');
            const response = await message.reply({ embeds: [mEmbed] });
            scheduleMessageCleanup(message, [response], 60000);
            return response;
          }

          if (MaintenanceService.isCommandDisabled(resolvedCommandName)) {
            const response = await message.reply({ content: `${Emojis.ban} Desculpe, Darling! O comando **\`${resolvedCommandName}\`** foi desativado temporariamente pela administração.` });
            scheduleMessageCleanup(message, [response], 60000);
            return response;
          }
        }

        if (typeof command.executeText === 'function') {
          try {
            StatsService.registerCommand(resolvedCommandName);
            const cooldown = await CooldownService.checkCooldown(message.author.id, message.guild.id, commandName);
            if (cooldown.inCooldown) {
              message.reply({ content: `Calma, Darling! Você está indo rápido demais. Tente novamente em **${ms(cooldown.remaining * 1000, { long: true })}**! 🦖🌸` })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
              return;
            }

            const capturedReplies: any[] = [];
            const originalReply = (message as any).reply;
            (message as any).reply = async (...replyArgs: any[]) => {
              const response = await originalReply.apply(message, replyArgs);
              capturedReplies.push(response);
              return response;
            };
            try {
              await command.executeText(message, args);
            } finally {
              (message as any).reply = originalReply;
            }
            const cleanupDelay = getTextCleanupDelay(command, resolvedCommandName);
            if (cleanupDelay !== null) scheduleMessageCleanup(message, capturedReplies, cleanupDelay);
            DashboardService.reportCommandUsage(message.guild.id, commandName, message.author.id).catch(() => {});
            return;
          } catch (err) {
            logger.error(`❌ Erro no comando de texto ${commandName}:`, err);
          }
        } else {
          message.reply({ content: `${Emojis.warning} Darling, o comando **\`/${commandName}\`** funciona apenas por barra (**\`/\`**)!` })
            .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
          return;
        }
      }
    }
  }

  // Check for AFK return
  if (userDb.afk?.since) {
    userDb.afk = null;
    await userDb.save();
    message.reply({ embeds: [ZeroTwoEmbed.success('Bem-vindo de volta!', `Fico feliz que você voltou, **${message.author.username}**! Removi seu estado AFK. 🦖🌸`)] })
      .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
  }

  // Performance: Otimização de menções AFK (Single Query)
  if (message.mentions.users.size > 0) {
    const mentionedIds = Array.from(message.mentions.users.keys());
    const mentionedUsers = await UserModel.find({ 
      userId: { $in: mentionedIds }, 
      guildId: message.guild.id,
      'afk.since': { $ne: null }
    });

    for (const afkUser of mentionedUsers) {
      const user = message.mentions.users.get(afkUser.userId);
      if (user) {
        message.reply({ embeds: [new ZeroTwoEmbed().setDescription(`**${user.username}** está AFK no momento.\n**Motivo:** ${afkUser.afk.reason}`)] });
      }
    }
  }

  const isViolating = await AutoModService.checkMessage(message);
  if (isViolating) return;

  // Performance: Passar documentos já carregados para os serviços
  await MessageService.recordMessage(message.author.id, message.guild.id, userDb);

  const xpGain = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
  const result = await LevelService.addXP(message.author.id, message.guild.id, xpGain, userDb, guildDb);

  if (result?.leveledUp && guildDb?.levels?.enabled) {
    const levelConfig = guildDb.levels;
    await LevelService.handleLevelRoles(message.member, result.newLevel);

    const levelMsg = levelConfig.message
      .replace('{user}', `<@${message.author.id}>`)
      .replace('{level}', result.newLevel.toString());

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.xp} ✨ Level Up!`)
      .setDescription(levelMsg)
      .setThumbnail(message.author.displayAvatarURL());
    
    const targetChannel = levelConfig.channelId 
      ? (message.guild.channels.cache.get(levelConfig.channelId) as TextChannel) 
      : (message.channel as TextChannel);

    if (targetChannel) {
      targetChannel.send({ content: `<@${message.author.id}>`, embeds: [embed] }).then(msg => {
        if (!levelConfig.channelId) setTimeout(() => msg.delete().catch(() => {}), 10000);
      });
    }
  }

  // Performance: Salvar todas as alterações de uma vez
  await userDb.save().catch((err: Error) => logger.error('❌ Erro ao salvar userDb:', err));

  // Verificar conquistas
  await AchievementService.checkAchievements(message.author.id, message.guild.id, message.channel as TextChannel, userDb);
});

  // Evento InteractionCreate (Slash Commands e Botões de Sorteio)
client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isButton() && interaction.customId === 'join_giveaway') {
    const result = await GiveawayService.addParticipant(interaction.message.id, interaction.user.id);
    if (!result.ok) {
      return interaction.reply({ embeds: [ZeroTwoEmbed.warning('Participação não registrada', result.reason || 'Não foi possível participar agora.')], ephemeral: true });
    }

    await interaction.reply({ content: `${Emojis.check} Você está participando do sorteio, Darling! Boa sorte! 🦖🌸`, ephemeral: true });
    return;
  }

  // Ticket Handlers
  if (interaction.isButton() && (interaction.customId === 'open_ticket_main' || interaction.customId === 'open_ticket_vip')) {
    const type = interaction.customId === 'open_ticket_vip' ? 'vip' : 'support';
    try {
      const channel = await TicketService.createTicket(interaction.member, type);
      await interaction.reply({ content: `${Emojis.check} Seu ticket foi criado com sucesso em ${channel}, Darling!`, ephemeral: true });
    } catch (err: any) {
      logInteractionFailure(interaction, 'ticket', 'TicketService.createTicket', err, `type=${type}`);
      const knownMessage = typeof err?.message === 'string' && (
        err.message.includes('sistema de tickets') ||
        err.message.includes('já possui um ticket aberto')
      ) ? err.message : 'Não foi possível criar o ticket agora. Verifique se o sistema está ativo e se a Loirinha possui permissão para gerenciar canais.';
      await interaction.reply({
        embeds: [ZeroTwoEmbed.warning('Ticket não criado', `${Emojis.ban} ${knownMessage}`)],
        ephemeral: true,
      });
    }
    return;
  }

  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    const channel = interaction.channel;
    if (!channel || !channel.isTextBased() || !('guild' in channel) || !channel.guild) {
      return interaction.reply({ embeds: [ZeroTwoEmbed.warning('Canal inválido', 'Este botão só pode ser usado dentro de um ticket do servidor.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const result = await TicketService.closeTicket(channel as TextChannel, interaction.user.id);
    if (!result.closed) {
      return interaction.editReply({ embeds: [ZeroTwoEmbed.warning('Não foi possível fechar', result.reason || 'Este ticket não pode ser encerrado agora.')] });
    }

    await interaction.editReply({ content: `${Emojis.check} Ticket encerrado e transcript enviado aos logs, Darling.` });
    return;
  }

  // Maintenance Handlers
  if (interaction.isButton() && interaction.customId === 'toggle_maintenance') {
    const OWNER_ID = config.OWNER_ID;
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({ content: `${Emojis.ban} Apenas meu Darling pode fazer isso!`, ephemeral: true });
    }

    const maintenance = await MaintenanceService.checkMaintenance();
    
    if (maintenance.enabled) {
      // Se já estiver ligado, apenas desliga
      await MaintenanceService.setMaintenance(false, 'Manutenção finalizada.', interaction.user.id);
      await interaction.reply({ content: `${Emojis.seta} O modo manutenção foi **desativado**. O Garden está aberto novamente! ${Emojis.achievement}`, ephemeral: true });
      
      // Atualizar a mensagem original se possível
      if (interaction.message.editable) {
        const embed = new ZeroTwoEmbed()
          .setTitle('🛠️ Painel de Manutenção Global')
          .setDescription(`• **Status Atual**: 🟢 **DESATIVADO**\n• **Motivo**: \`Manutenção finalizada.\``);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('toggle_maintenance').setLabel('Ativar Manutenção').setStyle(ButtonStyle.Danger).setEmoji('🔴')
        );
        await interaction.message.edit({ embeds: [embed], components: [row] }).catch(() => {});
      }
    } else {
      // Se estiver desligado, abre o modal para pedir o motivo
      const modal = new ModalBuilder()
        .setCustomId('maintenance_modal')
        .setTitle('Ativar Modo Manutenção');

      const reasonInput = new TextInputBuilder()
        .setCustomId('maintenance_reason')
        .setLabel('Qual o motivo da manutenção?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Ex: Atualização de segurança, novos comandos...')
        .setRequired(true)
        .setMaxLength(200);

      const row = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
      modal.addComponents(row);

      await interaction.showModal(modal);
    }
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId === 'maintenance_modal') {
    const OWNER_ID = config.OWNER_ID;
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({ embeds: [ZeroTwoEmbed.permissionError('Owner do bot')], ephemeral: true });
    }

    const reason = interaction.fields.getTextInputValue('maintenance_reason').trim();
    if (!reason || reason.length > 200) {
      return interaction.reply({ embeds: [ZeroTwoEmbed.warning('Motivo inválido', 'Informe um motivo entre 1 e 200 caracteres.')], ephemeral: true });
    }
    
    await MaintenanceService.setMaintenance(true, reason, interaction.user.id);
    
    await interaction.reply({ 
      content: `${Emojis.seta} O modo manutenção foi **ligado**. Todos os comandos foram pausados! ${Emojis.achievement}` 
    });

    // Atualizar a mensagem original
    if (interaction.message?.editable) {
      const embed = new ZeroTwoEmbed()
        .setTitle('🛠️ Painel de Manutenção Global')
        .setDescription(`• **Status Atual**: 🔴 **ATIVADO**\n• **Motivo**: \`${reason}\``);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('toggle_maintenance').setLabel('Desativar Manutenção').setStyle(ButtonStyle.Success).setEmoji('🟢')
      );
      await interaction.message.edit({ embeds: [embed], components: [row] }).catch(() => {});
    }
    return;
  }

  // SayEmbed Handlers
  if (interaction.isStringSelectMenu() && interaction.customId === 'sayembed_menu') {
    const val = interaction.values[0];
    const session = sayEmbedSessions.get(interaction.user.id);
    if (!session) {
      return interaction.reply({ content: `${Emojis.ban} Sessão expirada. Execute o comando novamente, Darling!`, ephemeral: true });
    }

    if (val === 'set_content') {
      const modal = new ModalBuilder().setCustomId('sayembed_modal_content').setTitle('Definir Mensagem');
      const input = new TextInputBuilder().setCustomId('content_input').setLabel('Mensagem acima do embed').setStyle(TextInputStyle.Paragraph).setValue(session.content).setMaxLength(2000).setRequired(true);
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
      return interaction.showModal(modal);
    }
    if (val === 'set_title') {
      const modal = new ModalBuilder().setCustomId('sayembed_modal_title').setTitle('Definir Título');
      const input = new TextInputBuilder().setCustomId('title_input').setLabel('Título do Embed').setStyle(TextInputStyle.Short).setValue(session.title).setRequired(true);
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
      return interaction.showModal(modal);
    }
    if (val === 'set_desc') {
      const modal = new ModalBuilder().setCustomId('sayembed_modal_desc').setTitle('Definir Descrição');
      const input = new TextInputBuilder().setCustomId('desc_input').setLabel('Descrição Principal').setStyle(TextInputStyle.Paragraph).setValue(session.description).setRequired(true);
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
      return interaction.showModal(modal);
    }
    if (val === 'set_color') {
      const modal = new ModalBuilder().setCustomId('sayembed_modal_color').setTitle('Definir Cor');
      const input = new TextInputBuilder().setCustomId('color_input').setLabel('Cor HEX (ex: #ff3b69)').setStyle(TextInputStyle.Short).setValue(session.color).setRequired(true);
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
      return interaction.showModal(modal);
    }
    if (val === 'set_footer') {
      const modal = new ModalBuilder().setCustomId('sayembed_modal_footer').setTitle('Definir Rodapé');
      const input = new TextInputBuilder().setCustomId('footer_input').setLabel('Texto do Rodapé').setStyle(TextInputStyle.Short).setValue(session.footer).setRequired(true);
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
      return interaction.showModal(modal);
    }
    if (val === 'set_image') {
      const modal = new ModalBuilder().setCustomId('sayembed_modal_image').setTitle('Definir Imagem');
      const input = new TextInputBuilder().setCustomId('image_input').setLabel('URL da Imagem').setStyle(TextInputStyle.Short).setValue(session.image || '').setRequired(false);
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
      return interaction.showModal(modal);
    }
    if (val === 'set_thumbnail') {
      const modal = new ModalBuilder().setCustomId('sayembed_modal_thumbnail').setTitle('Definir Thumbnail');
      const input = new TextInputBuilder().setCustomId('thumbnail_input').setLabel('URL da Thumbnail').setStyle(TextInputStyle.Short).setValue(session.thumbnail || '').setRequired(false);
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
      return interaction.showModal(modal);
    }
    if (val === 'set_channel') {
      const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId('sayembed_channel_select')
        .setPlaceholder('Selecione o canal do anúncio')
        .setMinValues(1)
        .setMaxValues(1)
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum);
      return interaction.update({
        embeds: [new EmbedBuilder().setColor(0xff3b69).setTitle(`${Emojis.seta} Selecionar canal`).setDescription('Escolha o canal onde o anúncio será enviado.')],
        components: [new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect)],
      });
    }
    if (val === 'add_reaction') {
      const modal = new ModalBuilder().setCustomId('sayembed_modal_reaction').setTitle('Adicionar Reação');
      const input = new TextInputBuilder().setCustomId('reaction_input').setLabel('Emoji (ex: ❤️)').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
      return interaction.showModal(modal);
    }
  }

  if (interaction.isChannelSelectMenu() && interaction.customId === 'sayembed_channel_select') {
    const session = sayEmbedSessions.get(interaction.user.id);
    const selectedChannel = interaction.channels.first();
    const selected = selectedChannel as { id?: string; type?: number; isTextBased?: () => boolean } | undefined;
    if (!session) return interaction.reply({ content: `${Emojis.ban} Sessão expirada, Darling!`, ephemeral: true });
    const isTextBasedChannel = selected && (
      typeof selected.isTextBased === 'function'
        ? selected.isTextBased()
        : [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum].includes(selected.type as ChannelType)
    );
    if (!selected?.id || !isTextBasedChannel) {
      return interaction.reply({ embeds: [ZeroTwoEmbed.warning('Canal inválido', 'Selecione um canal de texto válido para o anúncio.')], ephemeral: true });
    }
    session.channelId = selected.id;
    return interaction.update({ ...getSayEmbedPanel(session) });
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('sayembed_modal_')) {
    const field = interaction.customId.replace('sayembed_modal_', '');
    const session = sayEmbedSessions.get(interaction.user.id);
    if (!session) {
      return interaction.reply({ content: `${Emojis.ban} Sessão expirada, Darling!`, ephemeral: true });
    }

    const inputIds: Record<string, string> = {
      content: 'content_input',
      title: 'title_input',
      desc: 'desc_input',
      color: 'color_input',
      footer: 'footer_input',
      image: 'image_input',
      thumbnail: 'thumbnail_input',
      reaction: 'reaction_input',
    };
    const rawValue = interaction.fields.getTextInputValue(inputIds[field] || '').trim();
    const validationError = validateSayEmbedInput(field, rawValue, interaction.guild);
    if (validationError) {
      return interaction.reply({ embeds: [ZeroTwoEmbed.warning('Valor inválido', validationError)], ephemeral: true });
    }

    if (field === 'content') {
      session.content = rawValue;
    } else if (field === 'title') {
      session.title = rawValue;
    } else if (field === 'desc') {
      session.description = rawValue;
    } else if (field === 'color') {
      session.color = rawValue;
    } else if (field === 'footer') {
      session.footer = rawValue;
    } else if (field === 'image') {
      session.image = rawValue || undefined;
    } else if (field === 'thumbnail') {
      session.thumbnail = rawValue || undefined;
    } else if (field === 'reaction' && !session.reactions.includes(rawValue)) {
      session.reactions.push(rawValue);
    }

    const updatedPayload = getSayEmbedPanel(session);
    await interaction.reply({ ...updatedPayload, ephemeral: true });
    return;
  }

  if (interaction.isButton() && (interaction.customId === 'sayembed_send' || interaction.customId === 'sayembed_cancel')) {
    const session = sayEmbedSessions.get(interaction.user.id);
    if (!session) {
      return interaction.reply({ content: `${Emojis.ban} Sessão expirada, Darling!`, ephemeral: true });
    }

    if (interaction.customId === 'sayembed_cancel') {
      clearSayEmbedSession(interaction.user.id);
      await interaction.update({ content: `${Emojis.ban} Construtor de anúncios cancelado.`, embeds: [], components: [] });
      return;
    }

    if (interaction.customId === 'sayembed_send') {
      const targetChannel = session.channelId ? (interaction.guild?.channels.cache.get(session.channelId) as TextChannel) : (interaction.channel as TextChannel);
      if (!targetChannel?.isTextBased?.()) {
        return interaction.reply({ embeds: [ZeroTwoEmbed.warning('Canal inválido', 'Escolha um canal de texto válido no painel.')], ephemeral: true });
      }

      const botMember = interaction.guild?.members.me;
      if (botMember && !targetChannel.permissionsFor(botMember)?.has(['SendMessages', 'EmbedLinks'])) {
        return interaction.reply({ embeds: [ZeroTwoEmbed.permissionError('SendMessages e EmbedLinks no canal escolhido')], ephemeral: true });
      }

      const finalEmbed = new EmbedBuilder()
        .setColor(session.color as any)
        .setTitle(session.title)
        .setDescription(session.description)
        .setFooter({ text: session.footer });

      if (session.image) finalEmbed.setImage(session.image);
      if (session.thumbnail) finalEmbed.setThumbnail(session.thumbnail);

      const sentMsg = await targetChannel.send({ content: session.content || undefined, embeds: [finalEmbed] });

      // Reações automáticas
      for (const emoji of session.reactions) {
        try { await sentMsg.react(emoji); } catch {}
      }

      clearSayEmbedSession(interaction.user.id);
      await interaction.update({ content: `${Emojis.check} Anúncio enviado com sucesso para ${targetChannel}! 🌸`, embeds: [], components: [] });
      return;
    }
  }

  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command || typeof command.autocomplete !== 'function') return;

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      logger.error(`❌ Erro no autocomplete do comando ${interaction.commandName}:`, error);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // Deferir imediatamente: consultas ao MongoDB, cooldowns e manutenção não podem consumir a janela de 3 segundos do Discord.
  try {
    if (!interaction.deferred && !interaction.replied) {
      if (command.deferEphemeral) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      } else {
        await interaction.deferReply();
      }
    }
  } catch (error) {
    logInteractionFailure(interaction, interaction.commandName, 'interaction.deferReply', error, 'auto-defer imediato');
    return;
  }

  // Check Maintenance & Disabled Commands (Owner bypass)
  const maintenance = await MaintenanceService.checkMaintenance();
  const OWNER_ID = config.OWNER_ID;

  if (interaction.user.id !== OWNER_ID) {
    if (maintenance.enabled && interaction.commandName !== 'maintenance') {
      const mEmbed = new ZeroTwoEmbed()
        .setTitle('🛠️ Garden em Manutenção')
        .setDescription(`Desculpe, Darling! O Garden está passando por melhorias no momento.\n\n**Motivo:** ${maintenance.reason}\n\n*Por favor, tente novamente mais tarde!* 🦖🌸`)
        .setColor('#f1c40f');
      return interaction.editReply({ embeds: [mEmbed] });
    }

    if (MaintenanceService.isCommandDisabled(interaction.commandName)) {
      return interaction.editReply({
        content: `${Emojis.ban} Desculpe, Darling! O comando **\`${interaction.commandName}\`** foi desativado temporariamente pela administração.`
      });
    }
  }

  // Reportar uso do comando ao Dashboard
  DashboardService.reportCommandUsage(interaction.guildId!, interaction.commandName, interaction.user.id).catch(() => {});

  // Cooldown Check
  try {
    const cooldown = await CooldownService.checkCooldown(interaction.user.id, interaction.guildId!, interaction.commandName);
    if (cooldown.inCooldown) {
      await interaction.editReply({
        content: `Calma, Darling! Você está indo rápido demais. Tente novamente em **${ms(cooldown.remaining * 1000, { long: true })}**! 🦖🌸`
      }).catch(() => {});
      return;
    }
  } catch (err) {
      logInteractionFailure(interaction, interaction.commandName, 'cooldown.check', err, 'CooldownService');
  }

  try {
    StatsService.registerCommand(interaction.commandName);
    await command.execute(interaction);
  } catch (error) {
    StatsService.registerError();
      logInteractionFailure(interaction, interaction.commandName, 'command.execute', error, 'dispatcher Slash');
      const errorMessage = { content: `${Emojis.warning} A Zero Two não conseguiu concluir **/${interaction.commandName}** agora, Darling. Nenhuma alteração foi confirmada; tente novamente em instantes.` };
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply({ ...errorMessage, flags: MessageFlags.Ephemeral });
      }
    } catch (replyErr) {
      logInteractionFailure(interaction, interaction.commandName, 'interaction.errorReply', replyErr, 'fallback de erro');
    }
    }
  } catch (error) {
    StatsService.registerError();
    const commandName = interaction.isChatInputCommand() ? interaction.commandName : 'component';
    logInteractionFailure(interaction, commandName, 'interaction.dispatch', error, 'interactionCreate');
    const friendlyMessage = { content: `${Emojis.warning} Esta interação do Garden não pôde ser concluída agora, Darling. Nenhuma alteração foi confirmada; tente novamente em instantes.` };
    try {
      if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(friendlyMessage);
        } else {
          await interaction.reply({ ...friendlyMessage, flags: MessageFlags.Ephemeral });
        }
      }
    } catch (replyError) {
      logInteractionFailure(interaction, commandName, 'interaction.dispatch.errorReply', replyError, 'fallback global');
    }
  }
});

// Inicialização
async function main() {
  await connectDatabase();
  await loadCommands();

  // Validação já realizada pelo Zod no config centralizado

  client.on('messageDelete', (message) => LoggingService.logMessageDelete(message as Message));
  client.on('messageUpdate', (oldMsg, newMsg) => LoggingService.logMessageUpdate(oldMsg as Message, newMsg as Message));
  client.on('guildMemberAdd', (member) => {
    LoggingService.logMemberJoin(member);
    AutoModService.checkJoin(member);
  });
  client.on('guildMemberRemove', (member) => LoggingService.logMemberLeave(member));

  // Sync stats on shutdown
  process.on('SIGINT', async () => {
    await StatsService.syncToDb();
    process.exit(0);
  });

  await client.login(config.DISCORD_TOKEN);

  // Inicializar agendadores globais (Lembretes, Sorteios, etc)
  CronService.initialize(client);
}

main();
