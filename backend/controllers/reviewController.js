const { getConvexClient } = require('../utils/convexClient');

const safeJson = (input, fallback = null) => {
    if (input === null || input === undefined) return fallback;
    if (typeof input === 'object') return input;
    try {
        return JSON.parse(input);
    } catch {
        return fallback;
    }
};

exports.addReview = async (req, res) => {
    try {
        const { adventure_id, booking_id, rating, title, comment, photos } = req.body;
        const user_id = req.user.id;

        if (!adventure_id || !booking_id || rating == null) {
            return res.status(400).json({ success: false, message: 'adventure_id, booking_id, and rating are required' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be 1-5' });
        }
        const id = await getConvexClient().addReview({
            user_id,
            adventure_id,
            booking_id,
            rating: Number(rating),
            title,
            comment,
            photos: Array.isArray(photos) ? photos : safeJson(photos, []),
        });
        return res.json({ success: true, data: { id }, message: 'Review submitted, awaiting approval' });
    } catch (error) {
        console.error('addReview error:', error);
        const message = error.message || 'Failed to submit review';
        const status = /booking|review/i.test(message) ? 400 : 500;
        return res.status(status).json({ success: false, message });
    }
};

exports.getReviewsForAdventure = async (req, res) => {
    try {
        const adventure_id = req.params.adventureId || req.query.adventure_id;
        const { limit, approved_only } = req.query;

        if (!adventure_id) {
            return res.status(400).json({ success: false, message: 'adventure_id is required' });
        }

        const includeUnapproved = approved_only === 'false';
        if (includeUnapproved) {
            if (!req.user?.id) {
                return res.status(403).json({ success: false, message: 'Admin only' });
            }
            const dbUser = await getConvexClient().getUserById(req.user.id);
            if (!dbUser || dbUser.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Admin only' });
            }
        }

        const data = await getConvexClient().getReviewsForAdventure(adventure_id, {
            limit: limit ? Number(limit) : 50,
            approved_only: includeUnapproved ? false : true,
        });
        return res.json({ success: true, data });
    } catch (error) {
        console.error('getReviewsForAdventure error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
};

exports.getUserReviews = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // IDOR protection: users can only view their own reviews unless admin
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to view these reviews' });
        }
        
        const data = await getConvexClient().getReviewsByUser(userId);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch user reviews' });
    }
};

exports.getRatingSummary = async (req, res) => {
    try {
        const data = await getConvexClient().getReviewSummary(req.params.adventureId);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch rating summary' });
    }
};

exports.approveReview = async (req, res) => {
    try {
        await getConvexClient().approveReview(req.params.id);
        return res.json({ success: true, message: 'Review approved' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to approve review' });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        await getConvexClient().deleteReview(req.params.id);
        return res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete review' });
    }
};
