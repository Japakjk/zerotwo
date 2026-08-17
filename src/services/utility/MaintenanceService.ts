import { GlobalConfigModel } from '../../database/models/GlobalConfig.js';
import { logger } from '../../utils/logger.js';

export class MaintenanceService {
  private static isMaintenanceEnabled: boolean = false;
  private static maintenanceReason: string = '';
  private static disabledCommands: string[] = [];
  private static lastCheck: number = 0;

  /**
   * Verifica se o bot está em manutenção.
   * Utiliza um cache interno de 30 segundos para evitar consultas excessivas ao banco.
   */
  static async checkMaintenance(): Promise<{ enabled: boolean; reason: string; disabledCommands: string[] }> {
    const now = Date.now();
    if (now - this.lastCheck < 30000) {
      return { 
        enabled: this.isMaintenanceEnabled, 
        reason: this.maintenanceReason,
        disabledCommands: this.disabledCommands 
      };
    }

    try {
      const config = await GlobalConfigModel.findOne({ key: 'main_config' });
      if (config) {
        this.isMaintenanceEnabled = config.maintenance.enabled;
        this.maintenanceReason = config.maintenance.reason;
        this.disabledCommands = config.disabledCommands || [];
      }
      this.lastCheck = now;
    } catch (err) {
      logger.error('❌ Erro ao verificar estado de manutenção:', err);
    }

    return { 
      enabled: this.isMaintenanceEnabled, 
      reason: this.maintenanceReason,
      disabledCommands: this.disabledCommands 
    };
  }

  static isCommandDisabled(commandName: string): boolean {
    return this.disabledCommands.includes(commandName.toLowerCase());
  }

  /**
   * Altera o estado de manutenção.
   */
  static async setMaintenance(enabled: boolean, reason: string, userId: string): Promise<void> {
    await GlobalConfigModel.findOneAndUpdate(
      { key: 'main_config' },
      { 
        $set: { 
          'maintenance.enabled': enabled,
          'maintenance.reason': reason,
          'maintenance.since': enabled ? new Date() : null,
          'maintenance.setBy': userId,
          updatedAt: new Date()
        } 
      },
      { upsert: true, new: true }
    );
    
    this.isMaintenanceEnabled = enabled;
    this.maintenanceReason = reason;
    this.lastCheck = Date.now();
    
    logger.info(`🛠️ Modo de manutenção ${enabled ? 'ATIVADO' : 'DESATIVADO'} por ${userId}. Motivo: ${reason}`);
  }

  static async toggleCommand(commandName: string, enabled: boolean): Promise<void> {
    const name = commandName.toLowerCase();
    const config = await GlobalConfigModel.findOne({ key: 'main_config' });
    
    if (!config) {
      await GlobalConfigModel.create({ 
        key: 'main_config', 
        disabledCommands: enabled ? [] : [name] 
      });
      this.disabledCommands = enabled ? [] : [name];
    } else {
      let newList = config.disabledCommands || [];
      if (enabled) {
        newList = newList.filter((c: string) => c !== name);
      } else {
        if (!newList.includes(name)) newList.push(name);
      }
      
      config.disabledCommands = newList;
      config.updatedAt = new Date();
      await config.save();
      this.disabledCommands = newList;
    }
    
    this.lastCheck = Date.now();
  }
}
