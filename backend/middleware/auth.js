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

const auth = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Server misconfiguration: JWT secret missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user || decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

/**
 * Attach user when a valid token is present; continue anonymously otherwise.
 */
const optionalAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token || !process.env.JWT_SECRET) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user || decoded;
  } catch {
    // Invalid token on public route — ignore and proceed unauthenticated
  }
  next();
};

/**
 * Admin gate — revalidates role from database so demoted admins lose access immediately.
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

module.exports = { auth, optionalAuth, adminOnly };
