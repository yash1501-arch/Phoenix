const { getRedis } = require('./redis');
const logger = require('./logger');

/** In-memory fallback when Redis is unavailable (single-instance only). */
const memory = new Map();

function memoryGet(key) {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key, value, ttlSeconds) {
  memory.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
}

async function cacheGet(key) {
  const redis = getRedis();
  if (redis) {
    try {
      const raw = await redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      logger.warn('cacheGet redis failed:', err.message);
    }
  }
  return memoryGet(key);
}

async function cacheSet(key, value, ttlSeconds = 120) {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    } catch (err) {
      logger.warn('cacheSet redis failed:', err.message);
    }
  }
  memorySet(key, value, ttlSeconds);
}

async function cacheDel(key) {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(key);
    } catch (err) {
      logger.warn('cacheDel redis failed:', err.message);
    }
  }
  memory.delete(key);
}

/** Delete all keys matching prefix (scan in Redis; filter memory Map). */
async function cacheDelPrefix(prefix) {
  const redis = getRedis();
  if (redis) {
    try {
      let cursor = '0';
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = next;
        if (keys.length) await redis.del(...keys);
      } while (cursor !== '0');
    } catch (err) {
      logger.warn('cacheDelPrefix redis failed:', err.message);
    }
  }
  for (const key of memory.keys()) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
}

const CACHE_KEYS = {
  adventuresList: 'cache:adventures:list:',
  adventureById: 'cache:adventures:id:',
  settingsPublic: 'cache:settings:public',
};

async function invalidateAdventureCache() {
  await cacheDelPrefix(CACHE_KEYS.adventuresList);
  await cacheDelPrefix(CACHE_KEYS.adventureById);
}

async function invalidateSettingsCache() {
  await cacheDel(CACHE_KEYS.settingsPublic);
  await cacheDelPrefix(`${CACHE_KEYS.settingsPublic}:`);
}

module.exports = {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPrefix,
  CACHE_KEYS,
  invalidateAdventureCache,
  invalidateSettingsCache,
};
