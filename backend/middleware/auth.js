const jwt = require('jsonwebtoken');
const { getConvexClient } = require('../utils/convexClient');
const { COOKIE_NAME } = require('../utils/authCookie');
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
    return dbUser?.role === 'admin';
  } catch (err) {
    logger.error('isDbAdmin check failed:', err.message);
    return false;
  }
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
      req.user = result.user;
    }
  } catch {
    // Invalid token on public route — ignore and proceed unauthenticated
  }
  next();
};

/**
 * Admin gate — revalidates role from database so demoted admins lose access immediately.
 * Requires 2FA to be enabled before granting admin API access.
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
    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    if (!dbUser.totp_enabled || !dbUser.totp_secret) {
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

module.exports = { auth, optionalAuth, adminOnly, isDbAdmin };
