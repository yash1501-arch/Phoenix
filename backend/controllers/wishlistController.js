const { getConvexClient } = require('../utils/convexClient');

exports.add = async (req, res) => {
    try {
        const { adventure_id } = req.body;
        const user_id = req.user.id;

        if (!adventure_id) {
            return res.status(400).json({ success: false, message: 'adventure_id is required' });
        }
        const id = await getConvexClient().addToWishlist(user_id, adventure_id);
        return res.json({ success: true, data: { id } });
    } catch (error) {
        console.error('wishlist.add error:', error);
        return res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
    }
};

exports.remove = async (req, res) => {
    try {
        const { adventure_id } = req.body;
        const user_id = req.user.id;

        if (!adventure_id) {
            return res.status(400).json({ success: false, message: 'adventure_id is required' });
        }
        await getConvexClient().removeFromWishlist(user_id, adventure_id);
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
    }
};

exports.getByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to view this wishlist' });
        }

        const data = await getConvexClient().getWishlistByUser(userId);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
    }
};

exports.isWishlisted = async (req, res) => {
    try {
        const adventure_id = req.query.adventure_id;
        const user_id = req.user.id;

        if (!adventure_id) {
            return res.status(400).json({ success: false, message: 'adventure_id is required' });
        }

        const data = await getConvexClient().isWishlisted(user_id, adventure_id);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to check wishlist' });
    }
};
