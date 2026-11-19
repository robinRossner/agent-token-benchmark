import { createApp } from './server.js';
import { logger } from './lib/logger.js';

const port = Number(process.env.PORT ?? 3000);

createApp().listen(port, () => {
  logger.info('TaskFlow API listening', { port });
});
