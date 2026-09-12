const { getAbsoluteMaxAgeMs } = require('./sessionIdle');
const logger = require('./logger');

const COOKIE_NAME = 'phoenix_token';

const isProduction = process.env.NODE_ENV === 'production';

/** Warn when COOKIE_DOMAIN would prevent browsers from storing auth cookies. */
function validateCookieConfig() {
  const domain = String(process.env.COOKIE_DOMAIN || '').trim();
  if (!domain || !isProduction) return;

  const publicUrl = String(
    process.env.API_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || ''
  ).trim();
  let hostname = '';
  if (publicUrl) {
    try {
      hostname = new URL(publicUrl).hostname.toLowerCase();
    } catch {
      // ignore malformed URL
    }
  }

  const domainRoot = domain.replace(/^\./, '').toLowerCase();
  const onSiblingHost = hostname && (
    hostname === domainRoot || hostname.endsWith(`.${domainRoot}`)
  );

  if (!onSiblingHost) {
    logger.error(
      `COOKIE_DOMAIN=${domain} is set but the API public host is "${hostname || 'unknown'}". ` +
      'Browsers reject Domain cookies that do not match the Set-Cookie host. ' +
      'Unset COOKIE_DOMAIN while the API is on *.onrender.com, or add a custom domain ' +
      'such as api.<your-domain> and point VITE_API_URL at it.'
    );
  }
}

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
  validateCookieConfig,
};
