const { getConvexClient } = require('../utils/convexClient');

exports.add = async (req, res) => {
    try {
        const { user_id, adventure_id } = req.body;
        if (!user_id || !adventure_id) {
            return res.status(400).json({ success: false, message: 'user_id and adventure_id are required' });
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
        const { user_id, adventure_id } = req.body;
        if (!user_id || !adventure_id) {
            return res.status(400).json({ success: false, message: 'user_id and adventure_id are required' });
        }
        await getConvexClient().removeFromWishlist(user_id, adventure_id);
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
    }
};

exports.getByUser = async (req, res) => {
    try {
        const data = await getConvexClient().getWishlistByUser(req.params.userId);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
    }
};

exports.isWishlisted = async (req, res) => {
    try {
        const data = await getConvexClient().isWishlisted(req.query.user_id, req.query.adventure_id);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to check wishlist' });
    }
};
