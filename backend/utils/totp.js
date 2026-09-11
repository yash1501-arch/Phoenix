const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { generateSecret, generateURI, verifySync } = require('otplib');

const ISSUER = 'Phoenix Adventures';
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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
  const { decryptSecret } = require('./secretCrypto');
  const resolved = decryptSecret(secret);
  const code = String(token).replace(/\s/g, '');
  if (!/^\d{6}$/.test(code)) return false;
  try {
    const result = verifySync({ secret: resolved, token: code, epochTolerance: 1 });
    return Boolean(result?.valid);
  } catch {
    return false;
  }
}

function normalizeRecoveryCode(raw) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function formatRecoveryCode(raw) {
  const n = normalizeRecoveryCode(raw);
  if (n.length !== 8) return n;
  return `${n.slice(0, 4)}-${n.slice(4)}`;
}

function generateRecoveryCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i += 1) {
    let body = '';
    const bytes = crypto.randomBytes(8);
    for (let j = 0; j < 8; j += 1) {
      body += RECOVERY_ALPHABET[bytes[j] % RECOVERY_ALPHABET.length];
    }
    codes.push(formatRecoveryCode(body));
  }
  return codes;
}

async function hashRecoveryCodes(codes) {
  const hashes = [];
  for (const code of codes) {
    const hash = await bcrypt.hash(normalizeRecoveryCode(code), 10);
    hashes.push(hash);
  }
  return hashes;
}

/**
 * If `token` matches a recovery hash, return remaining hashes (without the used one).
 * Otherwise return null.
 */
async function consumeRecoveryCode(hashes, token) {
  if (!Array.isArray(hashes) || hashes.length === 0) return null;
  const normalized = normalizeRecoveryCode(token);
  if (normalized.length < 8) return null;

  for (let i = 0; i < hashes.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await bcrypt.compare(normalized, hashes[i]);
    if (ok) {
      return hashes.filter((_, idx) => idx !== i);
    }
  }
  return null;
}

function isRecoveryCodeShape(token) {
  const n = normalizeRecoveryCode(token);
  return n.length >= 8 && n.length <= 16 && !/^\d{6}$/.test(String(token).replace(/\s/g, ''));
}

module.exports = {
  generateSecret,
  buildOtpAuthUrl,
  verifyTotp,
  generateRecoveryCodes,
  hashRecoveryCodes,
  consumeRecoveryCode,
  formatRecoveryCode,
  normalizeRecoveryCode,
  isRecoveryCodeShape,
};
