import dotenv from 'dotenv';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

dotenv.config();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, '❌ O DISCORD_TOKEN é obrigatório e não foi fornecido nas variáveis de ambiente!'),
  MONGODB_URI: z.string().min(1, '❌ O MONGODB_URI é obrigatório e não foi fornecido nas variáveis de ambiente!'),
  PORT: z.string().optional().default('3000'),
  DEFAULT_PREFIX: z.string().min(1).optional().default('z.'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
  OWNER_ID: z.string().regex(/^\d{17,20}$/, 'OWNER_ID deve ser um ID Discord válido').optional().default('554833756431712267'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    logger.error('❌ Falha na validação das variáveis de ambiente (Zod):');
    for (const error of result.error.errors) {
      logger.error(`  - [${error.path.join('.')}]: ${error.message}`);
    }
    console.error('\n🌸 [Zero Two Config]: Por favor, verifique seu arquivo .env ou as variáveis de ambiente no painel da Railway!\n');
    process.exit(1);
  }

  return result.data;
};

export const config = parseEnv();
