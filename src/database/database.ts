import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

export async function connectDatabase(): Promise<void> {
  const uri = config.MONGODB_URI;

  try {
    logger.info('🌸 [DARLING-DB] Tentando conectar ao MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info('🌸 [DARLING-DB] Conectado com sucesso ao MongoDB Atlas! Dados salvos na nuvem.');

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ [DARLING-DB] Conexão perdida com o MongoDB! Tentando reconectar...');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`❌ [DARLING-DB] Erro na conexão: ${err.message}`);
    });
  } catch (error: any) {
    logger.error(`❌ Erro crítico ao conectar ao MongoDB Atlas: ${error.message}`);
    throw error;
  }
}
