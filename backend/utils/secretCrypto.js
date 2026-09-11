const crypto = require('crypto');
const logger = require('./logger');

const PREFIX = 'enc:v1:';
const ALGO = 'aes-256-gcm';

function getKey() {
  const raw = String(process.env.ENCRYPTION_KEY || '').trim();
  if (!raw) return null;
  let buf;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    buf = Buffer.from(raw, 'hex');
  } else {
    try {
      buf = Buffer.from(raw, 'base64');
    } catch {
      buf = null;
    }
  }
  if (!buf || buf.length !== 32) {
    logger.warn('ENCRYPTION_KEY must be 32 bytes (64 hex chars or base64). TOTP secrets stored plaintext until set.');
    return null;
  }
  return buf;
}

function encryptSecret(plaintext) {
  if (!plaintext) return plaintext;
  const key = getKey();
  if (!key) return String(plaintext);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

/**
 * Decrypt if encrypted; otherwise return original (legacy plaintext rows).
 */
function decryptSecret(stored) {
  if (!stored) return stored;
  const value = String(stored);
  if (!value.startsWith(PREFIX)) return value;
  const key = getKey();
  if (!key) {
    logger.error('Encrypted TOTP secret found but ENCRYPTION_KEY is missing/invalid');
    return value;
  }
  try {
    const parts = value.slice(PREFIX.length).split(':');
    if (parts.length !== 3) return value;
    const iv = Buffer.from(parts[0], 'base64');
    const tag = Buffer.from(parts[1], 'base64');
    const data = Buffer.from(parts[2], 'base64');
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(data), decipher.final()]);
    return out.toString('utf8');
  } catch (err) {
    logger.error('Failed to decrypt TOTP secret:', err.message);
    return value;
  }
}

module.exports = { encryptSecret, decryptSecret, getKey };
