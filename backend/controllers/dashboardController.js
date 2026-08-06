const { getConvexClient } = require('../utils/convexClient');
const logger = require('../utils/logger');

exports.getOverview = async (req, res) => {
  try {
    const data = await getConvexClient().getDashboardOverview();
    return res.json({ success: true, data });
  } catch (error) {
    logger.error('Dashboard overview error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard overview',
    });
  }
};
