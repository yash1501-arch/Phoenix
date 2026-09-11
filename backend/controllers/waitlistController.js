const { getConvexClient } = require('../utils/convexClient');
const logger = require('../utils/logger');

exports.join = async (req, res) => {
  try {
    const { email, phone, adventure_id, adventure_date } = req.body || {};
    const mail = String(email || req.user?.email || '').trim().toLowerCase();
    if (!mail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
      return res.status(400).json({ success: false, message: 'Valid email required' });
    }
    if (!adventure_id) {
      return res.status(400).json({ success: false, message: 'adventure_id is required' });
    }
    const adventure = await getConvexClient().getAdventureById(adventure_id);
    if (!adventure) {
      return res.status(404).json({ success: false, message: 'Adventure not found' });
    }
    await getConvexClient().joinWaitlist({
      email: mail,
      phone: phone ? String(phone).trim() : undefined,
      user_id: req.user?.id,
      adventure_id,
      adventure_date: adventure_date ? String(adventure_date).trim() : undefined,
    });
    return res.json({ success: true, message: "You're on the waitlist. We'll notify you when dates or seats open." });
  } catch (err) {
    logger.error('waitlist.join error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not join waitlist' });
  }
};
