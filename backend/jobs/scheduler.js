const { enqueue, JOBS, getQueue } = require('../utils/jobQueue');
const logger = require('./utils/logger');

let intervalHandles = [];

async function startScheduledJobs() {
  const q = await getQueue();
  if (q) {
    try {
      await q.add(JOBS.SEATS_EXPIRE_HOLDS, {}, {
        repeat: { every: 5 * 60 * 1000 },
        jobId: 'repeat-seats-expire',
      });
      await q.add(JOBS.TRIP_REMINDERS, {}, {
        repeat: { every: 60 * 60 * 1000 },
        jobId: 'repeat-trip-reminders',
      });
      logger.info('Repeating jobs registered on Redis queue');
      return;
    } catch (err) {
      logger.warn('Could not register repeating jobs:', err.message);
    }
  }

  intervalHandles.push(setInterval(() => {
    enqueue(JOBS.SEATS_EXPIRE_HOLDS, {}).catch((e) => logger.warn(e.message));
  }, 5 * 60 * 1000));
  intervalHandles.push(setInterval(() => {
    enqueue(JOBS.TRIP_REMINDERS, {}).catch((e) => logger.warn(e.message));
  }, 60 * 60 * 1000));
  logger.info('Inline reminder intervals started (no Redis repeat)');
}

function stopScheduledJobs() {
  for (const h of intervalHandles) clearInterval(h);
  intervalHandles = [];
}

module.exports = { startScheduledJobs, stopScheduledJobs };
