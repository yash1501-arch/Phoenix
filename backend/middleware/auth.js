const jwt = require('jsonwebtoken');
const { getConvexClient } = require('../utils/convexClient');
const { COOKIE_NAME, setAuthCookie, clearAuthCookie } = require('../utils/authCookie');
const { signAuthToken } = require('../utils/jwtHelpers');
const { isAdminRole, isStaffRole } = require('../utils/roles');
const { isIdleExpired, remainingTtlMs, shouldSlide } = require('../utils/sessionIdle');
const { verifyCloudflareAccessToken } = require('./cloudflareAccess');
const logger = require('../utils/logger');

const extractToken = (req) => {
  if (req.cookies?.[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }

  let token = req.header('x-auth-token');
  const authHeader = req.header('Authorization');
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  return token || null;
};

/**
 * Revalidate admin role from database (do not trust JWT role alone).
 */
async function isDbAdmin(userId) {
  if (!userId) return false;
  try {
    const dbUser = await getConvexClient().getUserById(userId);
    return isAdminRole(dbUser?.role);
  } catch (err) {
    logger.error('isDbAdmin check failed:', err.message);
    return false;
  }
}

async function isDbStaff(userId) {
  if (!userId) return false;
  try {
    const dbUser = await getConvexClient().getUserById(userId);
    return isStaffRole(dbUser?.role);
  } catch (err) {
    logger.error('isDbStaff check failed:', err.message);
    return false;
  }
}

function enforceIdleAndSlide(req, res, decoded, user) {
  if (isIdleExpired(decoded, user.role)) {
    clearAuthCookie(res);
    return { ok: false, status: 401, message: 'Session idle timeout. Please sign in again.' };
  }

  const ttl = remainingTtlMs(decoded);
  if (ttl <= 0) {
    clearAuthCookie(res);
    return { ok: false, status: 401, message: 'Session expired. Please sign in again.' };
  }

  if (req.cookies?.[COOKIE_NAME] && shouldSlide(decoded)) {
    const remainingSec = Math.max(1, Math.floor(ttl / 1000));
    const token = signAuthToken(user, { expiresIn: remainingSec, act: Date.now() });
    setAuthCookie(res, token, user.role, ttl);
  }

  return { ok: true };
}

async function validateSessionUser(decoded) {
  const userPayload = decoded.user || decoded;
  if (!userPayload?.id) {
    return { ok: false, status: 401, message: 'Token is not valid' };
  }

  const dbUser = await getConvexClient().getUserById(userPayload.id);
  if (!dbUser) {
    return { ok: false, status: 401, message: 'Token is not valid' };
  }

  const tokenVersion = userPayload.session_version ?? 0;
  const dbVersion = dbUser.session_version ?? 0;
  if (tokenVersion !== dbVersion) {
    return { ok: false, status: 401, message: 'Session expired. Please sign in again.' };
  }

  return {
    ok: true,
    user: {
      ...userPayload,
      id: dbUser._id,
      role: dbUser.role,
      name: dbUser.name,
      email: dbUser.email,
      session_version: dbVersion,
    },
  };
}

const auth = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Server misconfiguration: JWT secret missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await validateSessionUser(decoded);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    const idle = enforceIdleAndSlide(req, res, decoded, result.user);
    if (!idle.ok) {
      return res.status(idle.status).json({ message: idle.message });
    }
    req.user = result.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

/**
 * Attach user when a valid token is present; continue anonymously otherwise.
 */
const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (!token || !process.env.JWT_SECRET) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await validateSessionUser(decoded);
    if (result.ok) {
      const idle = enforceIdleAndSlide(req, res, decoded, result.user);
      if (idle.ok) {
        req.user = result.user;
      }
    }
  } catch {
    // Invalid token on public route — ignore and proceed unauthenticated
  }
  next();
};

/**
 * Admin gate — revalidates role from database so demoted admins lose access immediately.
 * When ADMIN_REQUIRE_2FA=true, admins must finish TOTP setup before other admin APIs.
 */
const adminOnly = async (req, res, next) => {
  if (process.env.REQUIRE_CF_ACCESS === 'true' && process.env.NODE_ENV === 'production') {
    const payload = await verifyCloudflareAccessToken(req.header('Cf-Access-Jwt-Assertion'));
    if (!payload) {
      return res.status(403).json({
        success: false,
        message: 'Cloudflare Access authentication required',
      });
    }
    req.cfAccess = { email: payload.email, sub: payload.sub };
  }

  if (!req.user?.id) {
    return res.status(403).json({ message: 'Access denied: Admin only' });
  }

  try {
    const dbUser = await getConvexClient().getUserById(req.user.id);
    if (!dbUser || !isAdminRole(dbUser.role)) {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const { isAdmin2faRequired, adminHas2fa } = require('../utils/admin2fa');
    if (isAdmin2faRequired() && !adminHas2fa(dbUser)) {
      return res.status(403).json({
        success: false,
        message: 'Enable two-factor authentication in Settings before accessing admin features.',
        requires2faSetup: true,
      });
    }

    req.user = {
      ...req.user,
      role: dbUser.role,
      name: dbUser.name,
      email: dbUser.email,
    };
    next();
  } catch (err) {
    logger.error('adminOnly role check failed:', err.message);
    return res.status(500).json({ message: 'Authorization check failed' });
  }
};

/**
 * Payments clerk or full admin. Does not require ADMIN_REQUIRE_2FA (admin-only policy).
 */
const clerkOrAdmin = async (req, res, next) => {
  if (process.env.REQUIRE_CF_ACCESS === 'true' && process.env.NODE_ENV === 'production') {
    const payload = await verifyCloudflareAccessToken(req.header('Cf-Access-Jwt-Assertion'));
    if (!payload) {
      return res.status(403).json({
        success: false,
        message: 'Cloudflare Access authentication required',
      });
    }
    req.cfAccess = { email: payload.email, sub: payload.sub };
  }

  if (!req.user?.id) {
    return res.status(403).json({ message: 'Access denied: Staff only' });
  }

  try {
    const dbUser = await getConvexClient().getUserById(req.user.id);
    if (!dbUser || !isStaffRole(dbUser.role)) {
      return res.status(403).json({ message: 'Access denied: Staff only' });
    }

    req.user = {
      ...req.user,
      role: dbUser.role,
      name: dbUser.name,
      email: dbUser.email,
    };
    next();
  } catch (err) {
    logger.error('clerkOrAdmin role check failed:', err.message);
    return res.status(500).json({ message: 'Authorization check failed' });
  }
};

module.exports = { auth, optionalAuth, adminOnly, clerkOrAdmin, isDbAdmin, isDbStaff };
