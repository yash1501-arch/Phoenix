/**
 * Production CORS: exact origins from CORS_ORIGINS, plus optional Vercel previews.
 * Do not use a bare * — browsers reject credentials:true with wildcard Allow-Origin.
 */

function parseCorsOrigins(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function isVercelPreviewOrigin(origin) {
  try {
    const u = new URL(origin);
    return u.protocol === 'https:' && /^[a-z0-9-]+\.vercel\.app$/i.test(u.hostname);
  } catch {
    return false;
  }
}

function isOriginAllowed(origin, allowedList, { allowVercelPreviews = false } = {}) {
  if (!origin) return true;
  const allowed = allowedList.map((s) => String(s).replace(/\/$/, ''));
  if (allowed.includes(origin)) return true;
  if (allowVercelPreviews && isVercelPreviewOrigin(origin)) return true;
  return false;
}

module.exports = {
  parseCorsOrigins,
  isOriginAllowed,
  isVercelPreviewOrigin,
};
