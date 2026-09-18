const http = require('http');
const https = require('https');

/**
 * Fetch remote image bytes for PDF embedding (best-effort).
 * @param {string} url
 * @returns {Promise<Buffer|null>}
 */
function fetchImageBuffer(url) {
  if (!url || typeof url !== 'string') return Promise.resolve(null);
  const abs = url.startsWith('http') ? url : `https://${url.replace(/^\/+/, '')}`;

  return new Promise((resolve) => {
    const lib = abs.startsWith('https') ? https : http;
    const req = lib.get(
      abs,
      { timeout: 12000, headers: { 'User-Agent': 'Phoenix-Adventures-PDF/1.0' } },
      (res) => {
        const follow = (location) => {
          if (!location) return resolve(null);
          fetchImageBuffer(location).then(resolve);
        };
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return follow(res.headers.location);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return resolve(null);
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

module.exports = { fetchImageBuffer };
