const { authenticator } = require('otplib');

authenticator.options = { window: 1 };

const ISSUER = 'Phoenix Adventures Admin';

function generateSecret() {
  return authenticator.generateSecret();
}

function buildOtpAuthUrl(email, secret) {
  return authenticator.keyuri(email, ISSUER, secret);
}

function verifyTotp(secret, token) {
  if (!secret || !token) return false;
  const code = String(token).replace(/\s/g, '');
  if (!/^\d{6}$/.test(code)) return false;
  return authenticator.verify({ token: code, secret });
}

module.exports = {
  generateSecret,
  buildOtpAuthUrl,
  verifyTotp,
};
