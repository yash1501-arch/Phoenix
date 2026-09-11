const { getConvexClient } = require('../utils/convexClient');
const logger = require('../utils/logger');

exports.getOverview = async (req, res) => {
  try {
    const year = req.query.year != null ? parseInt(String(req.query.year), 10) : undefined;
    const month = req.query.month != null ? parseInt(String(req.query.month), 10) : undefined;
    const data = await getConvexClient().getDashboardOverview({
      ...(Number.isFinite(year) ? { year } : {}),
      ...(Number.isFinite(month) ? { month } : {}),
    });
    return res.json({ success: true, data });
  } catch (error) {
    logger.error('Dashboard overview error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard overview',
    });
  }
};
