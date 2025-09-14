import { LoggerService, LogLevel } from '@nestjs/common';

export class CustomLoggerService implements LoggerService {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    console.log(`[${timestamp}] [${ctx}] ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    console.error(`[${timestamp}] [${ctx}] ❌ ERROR: ${message}`);
    if (trace) {
      console.error(`[${timestamp}] [${ctx}] 📍 Stack Trace: ${trace}`);
    }
  }

  warn(message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    console.warn(`[${timestamp}] [${ctx}] ⚠️  WARN: ${message}`);
  }

  debug(message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    console.debug(`[${timestamp}] [${ctx}] 🐛 DEBUG: ${message}`);
  }

  verbose(message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    console.log(`[${timestamp}] [${ctx}] 📝 VERBOSE: ${message}`);
  }
}

export const LOG_LEVELS: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];

export const LOG_CONFIG = {
  // Уровни логирования для разных окружений
  development: ['log', 'error', 'warn', 'debug', 'verbose'],
  production: ['log', 'error', 'warn'],
  test: ['error', 'warn'],
};

// Цвета для консоли
export const LOG_COLORS = {
  error: '\x1b[31m', // Красный
  warn: '\x1b[33m',  // Желтый
  log: '\x1b[32m',   // Зеленый
  debug: '\x1b[36m', // Голубой
  verbose: '\x1b[35m', // Фиолетовый
  reset: '\x1b[0m'   // Сброс
};


