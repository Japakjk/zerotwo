import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN não encontrado. Configure o token do bot no arquivo .env.'),
  MONGODB_URI: z.string().min(10).optional().or(z.literal('')).transform((value) => value || undefined),
  BOT_API_KEY: z.string().min(1).optional().or(z.literal('')).transform((value) => value || undefined),
  DASHBOARD_API_URL: z.string().url().optional().or(z.literal('')).transform((value) => value || undefined),
  OWNER_ID: z.string().min(1).optional().or(z.literal('')).transform((value) => value || undefined),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

export const env = envSchema.safeParse(process.env);

if (!env.success) {
  const issues = env.error.issues.map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`).join('\n');
  console.error('❌ Configuração inválida do ambiente:\n' + issues);
  process.exit(1);
}

export const config = env.data;
