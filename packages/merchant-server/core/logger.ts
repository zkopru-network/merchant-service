import createLogger from 'pino';

const logger = createLogger({
  name: 'merchant-server',
  level: process.env.LOG_LEVEL || 'info',
});

export default logger;
