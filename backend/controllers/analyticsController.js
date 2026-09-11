const { getConvexClient } = require('../utils/convexClient');
const logger = require('../utils/logger');

function istDate() {
  // Asia/Kolkata YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function normalizePath(raw) {
  let path = String(raw || '/').trim().split('?')[0].split('#')[0] || '/';
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 120) path = path.slice(0, 120);
  return path;
}

exports.recordVisit = async (req, res) => {
  try {
    const path = normalizePath(req.body?.path);
    const visitorId = String(req.body?.visitor_id || '').trim();
    if (!/^[a-zA-Z0-9_-]{8,64}$/.test(visitorId)) {
      return res.status(400).json({ success: false, message: 'Invalid visitor_id' });
    }
    // Skip obvious bots
    const ua = String(req.get('user-agent') || '').toLowerCase();
    if (!ua || /bot|crawl|spider|slurp|headless|preview/i.test(ua)) {
      return res.json({ success: true, skipped: true });
    }

    await getConvexClient().recordVisit({
      path,
      visitor_id: visitorId,
      date: istDate(),
    });
    return res.json({ success: true });
  } catch (error) {
    logger.error('recordVisit error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to record visit' });
  }
};
