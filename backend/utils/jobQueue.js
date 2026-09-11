const { getRedis, isRedisReady, getRedisConnectionOptions } = require('./redis');
const logger = require('./logger');

const QUEUE_NAME = 'phoenix-jobs';

let queue = null;
let worker = null;
let handlers = null;

function getHandlers() {
  if (handlers) return handlers;
  handlers = require('../jobs/handlers');
  return handlers;
}

async function getQueue() {
  if (!isRedisReady()) return null;
  if (queue) return queue;

  const connection = getRedisConnectionOptions();
  if (!connection) return null;

  try {
    const { Queue } = require('bullmq');
    queue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    });
    return queue;
  } catch (err) {
    logger.warn('BullMQ queue unavailable:', err.message);
    return null;
  }
}

/**
 * Enqueue a background job. Without Redis, runs the handler async (non-blocking).
 */
async function enqueue(jobName, payload = {}) {
  try {
    const q = await getQueue();
    if (q) {
      await q.add(jobName, payload);
      logger.info(`Job enqueued: ${jobName}`);
      return { queued: true, mode: 'redis' };
    }
  } catch (err) {
    logger.warn(`Queue enqueue failed (${err.message}) — running inline`);
  }

  setImmediate(() => {
    const map = getHandlers();
    const fn = map[jobName];
    if (!fn) {
      logger.error(`Unknown job (inline): ${jobName}`);
      return;
    }
    Promise.resolve()
      .then(() => fn(payload))
      .catch((e) => logger.error(`Inline job ${jobName} failed:`, e.message));
  });
  return { queued: true, mode: 'inline' };
}

/**
 * Start an in-process BullMQ worker only when Redis is ready.
 */
function startWorker() {
  if (!isRedisReady()) {
    logger.info('No Redis — jobs run inline; BullMQ worker not started');
    return null;
  }
  if (worker) return worker;

  const connection = getRedisConnectionOptions();
  if (!connection) return null;

  try {
    const { Worker } = require('bullmq');
    const map = getHandlers();

    worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const fn = map[job.name];
        if (!fn) throw new Error(`Unknown job: ${job.name}`);
        logger.info(`Processing job ${job.name} (${job.id})`);
        await fn(job.data);
      },
      { connection, concurrency: Number(process.env.JOB_CONCURRENCY || 5) }
    );

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.name} failed:`, err.message);
    });
    worker.on('error', (err) => {
      logger.warn('BullMQ worker error:', err.message);
    });

    logger.info('BullMQ worker started');
    return worker;
  } catch (err) {
    logger.warn('BullMQ worker not started:', err.message);
    return null;
  }
}

async function closeQueue() {
  if (worker) {
    await worker.close().catch(() => {});
    worker = null;
  }
  if (queue) {
    await queue.close().catch(() => {});
    queue = null;
  }
}

module.exports = {
  QUEUE_NAME,
  enqueue,
  getQueue,
  startWorker,
  closeQueue,
  JOBS: {
    BOOKING_CONFIRMATION: 'booking.confirmation',
    PAYMENT_REJECTED: 'payment.rejected',
    PAYMENT_SUBMITTED_ALERT: 'payment.submitted_alert',
    PARTICIPANTS_ROSTER_FULL: 'participants.roster_full',
    SEATS_EXPIRE_HOLDS: 'seats.expire_holds',
    TRIP_REMINDERS: 'trip.reminders',
    NEWSLETTER_BLAST: 'newsletter.blast',
    WAITLIST_NOTIFY: 'waitlist.notify',
    WISHLIST_DATES: 'wishlist.dates',
  },
};
