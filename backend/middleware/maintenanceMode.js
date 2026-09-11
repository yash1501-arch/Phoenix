const jwt = require('jsonwebtoken');
const { getConvexClient } = require('../utils/convexClient');
const { COOKIE_NAME } = require('../utils/authCookie');
const { isDbStaff } = require('./auth');
const logger = require('../utils/logger');

const BYPASS_PREFIXES = [
  '/health',
  '/api/health',
  '/api/auth/',
  '/api/settings/public',
];

let cache = { on: false, checkedAt: 0 };
const CACHE_MS = 30_000;

async function maintenanceEnabled() {
  const now = Date.now();
  if (now - cache.checkedAt < CACHE_MS) return cache.on;
  try {
    const settings = await getConvexClient().getSettings();
    cache = {
      on: String(settings.maintenance_mode).toLowerCase() === 'true',
      checkedAt: now,
    };
  } catch (err) {
    logger.warn('maintenanceMode: could not read settings:', err.message);
    cache = { on: false, checkedAt: now };
  }
  return cache.on;
}

function extractToken(req) {
  if (req.cookies?.[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const authHeader = req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.split(' ')[1];
  return req.header('x-auth-token') || null;
}

async function maintenanceAdminBypass(req) {
  const token = extractToken(req);
  if (!token || !process.env.JWT_SECRET) return false;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user?.id || decoded.id;
    return isDbStaff(userId);
  } catch {
    return false;
  }
}

/**
 * Return 503 when maintenance_mode is on, except for staff and auth/public health routes.
 */
async function maintenanceMode(req, res, next) {
  if (BYPASS_PREFIXES.some((p) => req.path === p || req.path.startsWith(p))) {
    return next();
  }

  const on = await maintenanceEnabled();
  if (!on) return next();

  if (await maintenanceAdminBypass(req)) return next();

  return res.status(503).json({
    success: false,
    message: 'Site is under maintenance. Please try again shortly.',
    maintenance: true,
  });
}

module.exports = maintenanceMode;
