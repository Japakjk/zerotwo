import { Client, TextChannel } from 'discord.js';
import cron from 'node-cron';
import { ReminderModel } from '../../database/models/Reminder.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { logger } from '../../utils/logger.js';

export class ReminderService {
  private static isInitialized = false;

  /**
   * Inicializa o cron job de lembretes.
   * Executa a cada 1 minuto.
   */
  static initialize(client: Client) {
    if (this.isInitialized) return;

    cron.schedule('* * * * *', () => {
      this.checkReminders(client).catch(err => {
        logger.error('❌ [ReminderService] Erro ao processar lembretes:', err);
      });
    });

    this.isInitialized = true;
    logger.info('⏰ [ReminderService] Sistema de lembretes inicializado.');
  }

  /**
   * Verifica e envia lembretes que atingiram o tempo.
   */
  private static async checkReminders(client: Client) {
    const now = new Date();
    const dueReminders = await ReminderModel.find({ remindAt: { $lte: now } });

    if (dueReminders.length === 0) return;

    for (const reminder of dueReminders) {
      try {
        const guild = await client.guilds.fetch(reminder.guildId).catch(() => null);
        if (!guild) {
          await reminder.deleteOne();
          continue;
        }

        const channel = await guild.channels.fetch(reminder.channelId).catch(() => null) as TextChannel | null;
        if (!channel) {
          await reminder.deleteOne();
          continue;
        }

        const embed = new ZeroTwoEmbed()
          .setTitle(`${Emojis.cat_utilidades} **Hora do Lembrete!**`)
          .setDescription(`Olá **Darling**! Você me pediu para te lembrar disso:\n\n> *"${reminder.reason}"*\n\n🦖🌸`)
          .setFooter({ text: 'Lembrete solicitado em' })
          .setTimestamp(reminder.createdAt);

        await channel.send({ content: `<@${reminder.userId}>`, embeds: [embed] });
        await reminder.deleteOne();
      } catch (err) {
        logger.error(`❌ [ReminderService] Falha ao enviar lembrete ${reminder._id}:`, err);
      }
    }
  }

  /**
   * Cria um novo lembrete.
   */
  static async createReminder(userId: string, guildId: string, channelId: string, reason: string, remindAt: Date) {
    return await ReminderModel.create({
      userId,
      guildId,
      channelId,
      reason,
      remindAt,
      createdAt: new Date()
    });
  }

  /**
   * Lista lembretes de um usuário.
   */
  static async getUserReminders(userId: string, guildId: string) {
    return await ReminderModel.find({ userId, guildId }).sort({ remindAt: 1 });
  }

  /**
   * Cancela um lembrete.
   */
  static async cancelReminder(reminderId: string, userId: string) {
    return await ReminderModel.findOneAndDelete({ _id: reminderId, userId });
  }
}
