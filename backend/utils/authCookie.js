const COOKIE_NAME = 'phoenix_token';

const isProduction = process.env.NODE_ENV === 'production';

const getCookieOptions = (role) => {
  const maxAge = role === 'admin'
    ? 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000;

  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax'),
    maxAge,
    path: '/',
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
};

const setAuthCookie = (res, token, role = 'user') => {
  res.cookie(COOKIE_NAME, token, getCookieOptions(role));
};

const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
    secure: isProduction,
    sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax'),
  });
};

module.exports = {
  COOKIE_NAME,
  setAuthCookie,
  clearAuthCookie,
};
