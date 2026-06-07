const { getConvexClient } = require('../utils/convexClient');

exports.list = async (req, res) => {
    try {
        const { limit, action } = req.query;
        const data = await getConvexClient().listAuditLog({
            limit: limit ? Number(limit) : 200,
            action: action || undefined,
        });
        return res.json({ success: true, data });
    } catch (error) {
        console.error('auditLog.list error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch audit log' });
    }
};
