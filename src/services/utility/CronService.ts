import { Client } from 'discord.js';
import cron from 'node-cron';
import { ReminderService } from './ReminderService.js';
import { GiveawayService } from './GiveawayService.js';
import { logger } from '../../utils/logger.js';

export class CronService {
  /**
   * Inicializa todos os serviços de agendamento do bot.
   */
  static initialize(client: Client) {
    logger.info('⚙️ [CronService] Inicializando agendadores globais...');

    // 1. Inicializar Lembretes (Cron interno de 1 min)
    ReminderService.initialize(client);

    // 2. Agendar Verificação de Sorteios (A cada 30 segundos)
    // Usamos cron para manter padrão, ou mantemos o loop do GiveawayService se preferir.
    // O cron do node-cron suporta segundos se configurado, mas o padrão é minutos.
    // Vamos usar um loop controlado para sorteios pois precisam de precisão de segundos.
    this.startGiveawayLoop(client);

    logger.info('⚙️ [CronService] Todos os agendadores estão operacionais.');
  }

  private static startGiveawayLoop(client: Client) {
    setInterval(() => {
      GiveawayService.checkGiveaways(client).catch(err => {
        logger.error('❌ [CronService] Erro no loop de sorteios:', err);
      });
    }, 30000);
  }
}
