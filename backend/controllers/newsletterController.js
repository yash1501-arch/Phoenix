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

exports.blast = async (req, res) => {
    try {
        const subject = String(req.body?.subject || '').trim();
        const body = String(req.body?.body || '').trim();
        if (!subject || !body) {
            return res.status(400).json({ success: false, message: 'subject and body are required' });
        }
        const { enqueue, JOBS } = require('../utils/jobQueue');
        await enqueue(JOBS.NEWSLETTER_BLAST, {
            subject,
            body,
            actor_id: req.user?.id,
        });
        getConvexClient().logAudit({
            actor_id: req.user.id,
            actor_email: req.user.email,
            action: 'newsletter.blast',
            target_type: 'newsletter',
            metadata: { subject },
        }).catch(() => {});
        return res.json({ success: true, message: 'Newsletter queued for delivery' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to send newsletter' });
    }
};
