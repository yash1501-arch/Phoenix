const { getConvexClient } = require('../utils/convexClient');

exports.subscribe = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Valid email required' });
        }
        await getConvexClient().subscribeNewsletter(String(email).toLowerCase());
        return res.json({ success: true, message: 'Subscribed successfully' });
    } catch (error) {
        console.error('newsletter.subscribe error:', error);
        return res.status(500).json({ success: false, message: 'Failed to subscribe' });
    }
};

exports.unsubscribe = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'email required' });
        }
        await getConvexClient().unsubscribeNewsletter(String(email).toLowerCase());
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to unsubscribe' });
    }
};

exports.getAll = async (req, res) => {
    try {
        const data = await getConvexClient().getNewsletterSubscribers();
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch subscribers' });
    }
};
