import { logger } from './logger.js';

export function getFriendlyErrorMessage(error: unknown, fallback = 'Ocorreu um erro inesperado. Tente novamente em instantes.') {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('missing permission') || message.includes('permission')) {
      return '❌ Você não tem permissão para executar esta ação.';
    }

    if (message.includes('unknown interaction') || message.includes('interaction has already been acknowledged')) {
      return '❌ Esta interação já foi finalizada.';
    }

    if (message.includes('mongodb') || message.includes('mongo')) {
      return '❌ O banco de dados está indisponível no momento. Tente novamente mais tarde.';
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return '⏳ Muitas tentativas em pouco tempo. Aguarde alguns segundos e tente novamente.';
    }
  }

  return fallback;
}

export function logError(context: string, error: unknown, metadata?: Record<string, unknown>): void {
  logger.error(context, {
    error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
    ...metadata,
  });
}
