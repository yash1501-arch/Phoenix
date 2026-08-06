const { generateSecret, generateURI, verifySync } = require('otplib');

const ISSUER = 'Phoenix Adventures Admin';

function buildOtpAuthUrl(email, secret) {
  return generateURI({
    issuer: ISSUER,
    label: email,
    secret,
    strategy: 'totp',
  });
}

function verifyTotp(secret, token) {
  if (!secret || !token) return false;
  const code = String(token).replace(/\s/g, '');
  if (!/^\d{6}$/.test(code)) return false;
  try {
    const result = verifySync({ secret, token: code, epochTolerance: 1 });
    return Boolean(result?.valid);
  } catch {
    return false;
  }
}

module.exports = {
  generateSecret,
  buildOtpAuthUrl,
  verifyTotp,
};
