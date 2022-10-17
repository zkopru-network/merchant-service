import createLogger from 'pino';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
});

export default logger;
