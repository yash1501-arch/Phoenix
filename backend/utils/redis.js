const logger = require('./logger');

let redis = null;
let state = 'idle'; // idle | ready | disabled
let initPromise = null;
let lastErrorLog = 0;

/**
 * Initialize Redis once. Safe if REDIS_URL is missing or Redis is down —
 * falls back to in-memory mode without crashing the API.
 */
async function initRedis() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const url = process.env.REDIS_URL;
    if (!url) {
      state = 'disabled';
      logger.info('REDIS_URL not set — using in-memory cache/rate-limit/queue fallback');
      return null;
    }

    let client = null;
    try {
      const Redis = require('ioredis');
      client = new Redis(url, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        enableOfflineQueue: false,
        lazyConnect: true,
        connectTimeout: 2500,
        retryStrategy() {
          return null;
        },
      });

      client.on('error', (err) => {
        const now = Date.now();
        if (now - lastErrorLog > 10000) {
          lastErrorLog = now;
          logger.warn('Redis error:', err.message);
        }
      });

      await Promise.race([
        client.connect().then(() => client.ping()),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Redis connect timeout')), 3000);
        }),
      ]);

      redis = client;
      state = 'ready';
      logger.info('Redis connected');

      client.on('end', () => {
        if (state === 'ready') {
          state = 'disabled';
          redis = null;
          logger.warn('Redis connection lost — switching to in-memory fallback');
        }
      });

      return redis;
    } catch (err) {
      state = 'disabled';
      redis = null;
      if (client) {
        try {
          client.disconnect();
        } catch {
          // ignore
        }
      }
      logger.warn(
        `Redis unavailable (${err.message}) — using in-memory cache/jobs. ` +
          'Start it with: docker compose up -d redis'
      );
      return null;
    }
  })();

  return initPromise;
}

/** Returns a ready Redis client, or null (use memory fallbacks). */
function getRedis() {
  if (state !== 'ready') return null;
  return redis;
}

function isRedisReady() {
  return state === 'ready' && Boolean(redis);
}

/** Connection options for BullMQ (it prefers its own connections). */
function getRedisConnectionOptions() {
  if (!process.env.REDIS_URL || state === 'disabled') return null;
  if (state !== 'ready') return null;
  return process.env.REDIS_URL;
}

module.exports = {
  initRedis,
  getRedis,
  isRedisReady,
  getRedisConnectionOptions,
};
