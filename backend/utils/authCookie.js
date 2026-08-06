const COOKIE_NAME = 'phoenix_token';

const isProduction = process.env.NODE_ENV === 'production';

const getCookieOptions = () => {
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax'),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
};

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
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
