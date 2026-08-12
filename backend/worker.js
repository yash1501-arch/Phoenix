/**
 * Dedicated background worker for email / WhatsApp / other async jobs.
 * Deploy as a second Koyeb service with the same image:
 *   CMD: node worker.js
 * Requires REDIS_URL.
 */
require('dotenv').config();

const logger = require('./utils/logger');
const { getRedis } = require('./utils/redis');
const { startWorker, closeQueue } = require('./utils/jobQueue');

async function main() {
  if (!process.env.REDIS_URL) {
    logger.error('REDIS_URL is required for the dedicated worker');
    process.exit(1);
  }

  getRedis();
  startWorker();
  logger.info('Worker process ready — waiting for jobs');

  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down worker`);
    await closeQueue();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('Worker failed to start:', err.message);
  process.exit(1);
});
