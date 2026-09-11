const { getAbsoluteMaxAgeMs } = require('./sessionIdle');

const COOKIE_NAME = 'phoenix_token';

const isProduction = process.env.NODE_ENV === 'production';

const getCookieOptions = (role, maxAgeOverride) => {
  const maxAge = maxAgeOverride != null
    ? maxAgeOverride
    : getAbsoluteMaxAgeMs(role);

  // Cross-site SPA (Vercel *.vercel.app or custom Hostinger domain) + API on
  // Render/Koyeb requires SameSite=None; Secure. Do not set COOKIE_DOMAIN unless
  // the API hostname is a sibling subdomain (e.g. api.yourdomain.in).
  const sameSite = (process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();
  const options = {
    httpOnly: true,
    secure: isProduction || sameSite === 'none',
    sameSite,
    maxAge,
    path: '/',
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
};

const setAuthCookie = (res, token, role = 'user', maxAgeOverride) => {
  res.cookie(COOKIE_NAME, token, getCookieOptions(role, maxAgeOverride));
};

const clearAuthCookie = (res) => {
  const sameSite = (process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();
  res.clearCookie(COOKIE_NAME, {
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
    secure: isProduction || sameSite === 'none',
    sameSite,
  });
};

module.exports = {
  COOKIE_NAME,
  setAuthCookie,
  clearAuthCookie,
};
