const crypto = require('crypto');

const CSRF_COOKIE = 'csrf_token';
const isProduction = process.env.NODE_ENV === 'production';

const SKIP_PREFIXES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/2fa/verify-login',
  '/api/auth/2fa/emergency-reset',
  '/api/health',
  '/health',
];

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getCookieOptions() {
  const sameSite = (process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();
  return {
    httpOnly: false,
    secure: isProduction || sameSite === 'none',
    sameSite,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  };
}

function shouldSkipCsrf(req) {
  const path = req.originalUrl.split('?')[0];
  return SKIP_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * Ensure every client has a CSRF cookie (double-submit pattern).
 */
function exposeCsrfHeader(req, res, next) {
  const token = req.cookies?.[CSRF_COOKIE];
  if (token) {
    // Cross-site SPAs cannot read api-host cookies via document.cookie; echo token for XHR clients.
    res.setHeader('X-CSRF-Token', token);
  }
  next();
}

function ensureCsrfCookie(req, res, next) {
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, getCookieOptions());
    req.cookies = { ...req.cookies, [CSRF_COOKIE]: token };
  }
  exposeCsrfHeader(req, res, next);
}

/**
 * Validate X-CSRF-Token header matches csrf_token cookie on state-changing /api/* requests.
 */
function validateCsrf(req, res, next) {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  const path = req.originalUrl.split('?')[0];
  if (!path.startsWith('/api/') || shouldSkipCsrf(req)) {
    return next();
  }

  const headerToken = req.header('x-csrf-token');
  const cookieToken = req.cookies?.[CSRF_COOKIE];

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token',
    });
  }

  return next();
}

module.exports = {
  CSRF_COOKIE,
  ensureCsrfCookie,
  exposeCsrfHeader,
  validateCsrf,
};
