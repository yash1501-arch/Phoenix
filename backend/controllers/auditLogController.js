const { getConvexClient } = require('../utils/convexClient');

exports.list = async (req, res) => {
    try {
        const { limit, action, actor, booking_code } = req.query;
        const data = await getConvexClient().listAuditLog({
            limit: limit ? Number(limit) : 200,
            action: action || undefined,
            actor: actor || undefined,
            booking_code: booking_code || undefined,
        });
        return res.json({ success: true, data });
    } catch (error) {
        console.error('auditLog.list error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch audit log' });
    }
};
