import { Schema } from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IGlobalConfig {
  key: string;
  maintenance: {
    enabled: boolean;
    reason: string;
    since: Date | null;
    setBy: string | null;
  };
  disabledCommands: string[];
  updatedAt: Date;
}

const globalConfigSchema = new Schema<IGlobalConfig>({
  key: { type: String, default: 'main_config', unique: true },
  maintenance: {
    enabled: { type: Boolean, default: false },
    reason: { type: String, default: 'Manutenção programada para melhorias no Garden.' },
    since: { type: Date, default: null },
    setBy: { type: String, default: null }
  },
  disabledCommands: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

export const GlobalConfigModel = createMockModel('GlobalConfig', globalConfigSchema);
