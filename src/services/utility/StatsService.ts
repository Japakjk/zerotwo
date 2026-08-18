import { BotStatsModel } from '../../database/models/BotStats.js';
import { logger } from '../../utils/logger.js';

export interface IBotMetrics {
  totalCommands: number;
  totalMessages: number;
  totalErrors: number;
  commandUsage: Map<string, number>;
}

export class StatsService {
  private static botId = 'zero-two-main';
  private static memoryStats = {
    commands: 0,
    messages: 0,
    errors: 0,
    commandUsage: new Map<string, number>()
  };

  private static lastSync = Date.now();
  private static SYNC_INTERVAL = 1000 * 60 * 5; // 5 minutos

  static registerCommand(commandName: string) {
    this.memoryStats.commands++;
    const current = this.memoryStats.commandUsage.get(commandName) || 0;
    this.memoryStats.commandUsage.set(commandName, current + 1);
    this.checkSync();
  }

  static registerMessage() {
    this.memoryStats.messages++;
    this.checkSync();
  }

  static registerError() {
    this.memoryStats.errors++;
    this.checkSync();
  }

  static async getStats(): Promise<IBotMetrics> {
    const dbStats = await BotStatsModel.findOne({ botId: this.botId });
    
    if (!dbStats) {
      return {
        totalCommands: this.memoryStats.commands,
        totalMessages: this.memoryStats.messages,
        totalErrors: this.memoryStats.errors,
        commandUsage: new Map(this.memoryStats.commandUsage)
      };
    }

    // Merge memory stats with DB stats for real-time view
    const usage = new Map<string, number>();
    
    // Copy DB stats
    if (dbStats.commandUsage) {
      dbStats.commandUsage.forEach((count: number, name: string) => {
        usage.set(name, count);
      });
    }

    // Add memory stats
    this.memoryStats.commandUsage.forEach((count, name) => {
      usage.set(name, (usage.get(name) || 0) + count);
    });

    return {
      totalCommands: (dbStats.totalCommands || 0) + this.memoryStats.commands,
      totalMessages: (dbStats.totalMessages || 0) + this.memoryStats.messages,
      totalErrors: (dbStats.totalErrors || 0) + this.memoryStats.errors,
      commandUsage: usage
    };
  }

  private static async checkSync() {
    if (Date.now() - this.lastSync > this.SYNC_INTERVAL) {
      await this.syncToDb();
    }
  }

  static async syncToDb() {
    try {
      let stats = await BotStatsModel.findOne({ botId: this.botId });
      if (!stats) {
        stats = new BotStatsModel({ botId: this.botId });
      }

      stats.totalCommands = (stats.totalCommands || 0) + this.memoryStats.commands;
      stats.totalMessages = (stats.totalMessages || 0) + this.memoryStats.messages;
      stats.totalErrors = (stats.totalErrors || 0) + this.memoryStats.errors;

      this.memoryStats.commandUsage.forEach((count, name) => {
        const current = stats!.commandUsage.get(name) || 0;
        stats!.commandUsage.set(name, current + count);
      });

      stats.updatedAt = new Date();
      await stats.save();

      // Reset memory counters
      this.memoryStats.commands = 0;
      this.memoryStats.messages = 0;
      this.memoryStats.errors = 0;
      this.memoryStats.commandUsage.clear();
      
      this.lastSync = Date.now();
      logger.info('[StatsService] Métricas sincronizadas com o banco de dados.');
    } catch (err) {
      logger.error('[StatsService] Erro ao sincronizar métricas:', err);
    }
  }
}
