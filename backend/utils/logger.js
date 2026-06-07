const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const timestamp = () => new Date().toISOString();

const logger = {
  error: (msg, ...args) => {
    if (levels[level] >= levels.error) console.error(`[${timestamp()}] [ERROR] ${msg}`, ...args);
  },
  warn: (msg, ...args) => {
    if (levels[level] >= levels.warn) console.warn(`[${timestamp()}] [WARN] ${msg}`, ...args);
  },
  info: (msg, ...args) => {
    if (levels[level] >= levels.info) console.log(`[${timestamp()}] [INFO] ${msg}`, ...args);
  },
  debug: (msg, ...args) => {
    if (levels[level] >= levels.debug) console.log(`[${timestamp()}] [DEBUG] ${msg}`, ...args);
  },
};

module.exports = logger;
