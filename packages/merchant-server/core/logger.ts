import pino from 'pino';
import { ILogger } from './interfaces';

export function createLogger() : ILogger {
  return pino({
    name: 'merchant-server',
    level: process.env.LOG_LEVEL || 'info',
  });
}
