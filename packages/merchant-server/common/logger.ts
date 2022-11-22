import pino from 'pino';
import { ILogger } from './interfaces';

export function createLogger(options: pino.LoggerOptions = {}) : ILogger {
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    ...options,
    name: 'merchant-server',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  });
}
