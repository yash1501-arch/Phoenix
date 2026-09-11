const { isStaffRole } = require('./roles');

function parseMinutes(raw, fallback) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

/** Idle window in ms. Staff default 45 min. Users: 0 = off. */
function getIdleMs(role) {
  if (isStaffRole(role)) {
    return parseMinutes(process.env.ADMIN_IDLE_MINUTES, 45) * 60 * 1000;
  }
  return parseMinutes(process.env.USER_IDLE_MINUTES, 0) * 60 * 1000;
}

function getAbsoluteMaxAgeMs(role) {
  return isStaffRole(role) ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
}

function activityAt(decoded) {
  if (typeof decoded?.act === 'number' && decoded.act > 0) return decoded.act;
  if (typeof decoded?.iat === 'number') return decoded.iat * 1000;
  return Date.now();
}

function isIdleExpired(decoded, role) {
  const idleMs = getIdleMs(role);
  if (!idleMs) return false;
  return Date.now() - activityAt(decoded) > idleMs;
}

function remainingTtlMs(decoded) {
  if (!decoded?.exp) return getAbsoluteMaxAgeMs(decoded?.user?.role || decoded?.role);
  const remaining = decoded.exp * 1000 - Date.now();
  return Math.max(0, remaining);
}

/** Re-issue cookie at most once per minute of activity (sliding idle, same absolute exp). */
function shouldSlide(decoded) {
  return Date.now() - activityAt(decoded) >= 60 * 1000;
}

module.exports = {
  getIdleMs,
  getAbsoluteMaxAgeMs,
  activityAt,
  isIdleExpired,
  remainingTtlMs,
  shouldSlide,
};
