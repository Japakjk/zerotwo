import { Client, GatewayIntentBits, Collection, REST, Routes, MessageFlags } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDatabase } from './database/database.js';
import { logger } from './utils/logger.js';
import { UserModel } from './database/models/User.js';
import { LevelService } from './services/leveling/LevelService.js';
import { AchievementService } from './services/leveling/AchievementService.js';
import { LoggingService } from './services/logging/LoggingService.js';
import { AutoModService } from './services/automod/AutoModService.js';
import { CooldownService } from './services/economy/CooldownService.js';
import { MessageService } from './services/economy/MessageService.js';
import { ZeroTwoEmbed } from './utils/embeds.js';
import ms from 'ms';
import { TextChannel } from 'discord.js';

dotenv.config();

process.on('unhandledRejection', (error) => {
  logger.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
});

const __dirname = process.cwd() + '/dist';

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
        client.commands.set(command.default.data.name, command.default);
        logger.info(`🌸 [COMMAND] Carregado: ${command.default.data.name} (${category})`);
      }
    }
  }
}

// Evento Ready
  client.once('ready', async () => {
    logger.info(`🌸 [DARLING-BOT] Logado com sucesso como ${client.user?.tag}! A Zero Two está pronta.`);
  
  client.user?.setPresence({
    activities: [{ name: 'Procurando meu Darling 🦖❤️', type: 0 }],
    status: 'online',
  });
});

// Evento de Mensagem para XP, AutoMod e Logs
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // Check for AFK return
  const userData = await UserModel.findOne({ userId: message.author.id, guildId: message.guild.id });
  if (userData?.afk?.since) {
    userData.afk = null;
    await userData.save();
    message.reply({ embeds: [ZeroTwoEmbed.success('Bem-vindo de volta!', `Fico feliz que você voltou, **${message.author.username}**! Removi seu estado AFK. 🦖🌸`)] })
      .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
  }

  // Check for AFK mentions
  if (message.mentions.users.size > 0) {
    message.mentions.users.forEach(async (user) => {
      const mentionedUser = await UserModel.findOne({ userId: user.id, guildId: message.guild!.id });
      if (mentionedUser?.afk?.since) {
        message.reply({ embeds: [new ZeroTwoEmbed().setDescription(`**${user.username}** está AFK no momento.\\n**Motivo:** ${mentionedUser.afk.reason}`)] });
      }
    });
  }

  const isViolating = await AutoModService.checkMessage(message);
  if (isViolating) return;

  // Registrar mensagem para estatísticas e recompensas
  await MessageService.recordMessage(message.author.id, message.guild.id);

  const xpGain = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
  const result = await LevelService.addXP(message.author.id, message.guild.id, xpGain);

  if (result?.leveledUp) {
    const embed = new ZeroTwoEmbed()
      .setTitle('✨ Level Up!')
      .setDescription(`Parabéns, **${message.author.username}**! Você subiu para o nível **${result.newLevel}**.\n\nVocê agora é um Darling ainda mais forte! 🦖❤️`)
      .setThumbnail(message.author.displayAvatarURL());
    
    message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed] }).then(msg => {
      setTimeout(() => msg.delete().catch(() => {}), 10000);
    });
  }

  // Verificar conquistas
  await AchievementService.checkAchievements(message.author.id, message.guild!.id, message.channel as TextChannel);
});

// Evento InteractionCreate (Slash Commands)
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // Global & Special Cooldown Check first (sync/fast)
  try {
    const cooldown = await CooldownService.checkCooldown(interaction.user.id, interaction.guildId!, interaction.commandName);
    if (cooldown.inCooldown) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({
          content: `Calma, Darling! Você está indo rápido demais. Tente novamente em **${ms(cooldown.remaining * 1000, { long: true })}**! 🦖🌸`,
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      } else {
        await interaction.editReply({
          content: `Calma, Darling! Você está indo rápido demais. Tente novamente em **${ms(cooldown.remaining * 1000, { long: true })}**! 🦖🌸`
        }).catch(() => {});
      }
      return;
    }
  } catch (err) {
    logger.error('❌ Erro no cooldown check:', err);
  }

  // Auto-defer safely
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply().catch(() => {});
    }
  } catch (e) {
    logger.error('❌ Erro ao deferir interação:', e);
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(`❌ Erro ao executar o comando ${interaction.commandName}:`, error);
    const errorMessage = { content: 'Houve um erro interno ao executar este comando, Darling!' };
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply({ ...errorMessage, flags: MessageFlags.Ephemeral });
      }
    } catch (replyErr) {
      logger.error('❌ Erro ao enviar mensagem de erro:', replyErr);
    }
  }
});

// Inicialização
async function main() {
  await connectDatabase();
  await loadCommands();

  if (!process.env.DISCORD_TOKEN) {
    logger.error('❌ DISCORD_TOKEN não encontrado no arquivo .env!');
    process.exit(1);
  }

  client.on('messageDelete', (message) => LoggingService.logMessageDelete(message));
  client.on('guildMemberAdd', (member) => LoggingService.logMemberJoin(member));

  await client.login(process.env.DISCORD_TOKEN);
}

main();
