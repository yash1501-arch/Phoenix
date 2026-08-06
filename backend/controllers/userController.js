const { getConvexClient } = require('../utils/convexClient');
const { sanitizeUser } = require('../utils/sanitizeUser');
const { isDbAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
require('dotenv').config();

/**
 * Get all users with pagination and search
 */
const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        const result = await getConvexClient().getUsers({
            page: parseInt(page),
            limit: parseInt(limit),
            search
        });

        // Strip password hashes from all user objects
        if (result.data && Array.isArray(result.data)) {
            result.data = result.data.map(sanitizeUser);
        }

        res.json(result);
    } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.id !== id && !(await isDbAdmin(req.user.id))) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this user' });
        }

        const result = await getConvexClient().getUserById(id);

        if (!result) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: sanitizeUser(result) });
    } catch (error) {
        logger.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
};

/**
 * Update user (owner or admin only)
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        // IDOR protection: users can only update their own profile unless admin
        if (req.user.id !== id && !(await isDbAdmin(req.user.id))) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this user' });
        }

        const updateData = req.body;

        // Prevent role and password updates through this general endpoint
        delete updateData.role;
        delete updateData.password;
        delete updateData._id;
        delete updateData.email; // Email changes should go through a separate verified flow

        const result = await getConvexClient().updateUser(id, updateData);

        if (!result) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: sanitizeUser(result) });
    } catch (error) {
        logger.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
};

/**
 * Upload avatar (owner only)
 */
const uploadAvatar = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.id !== id && !(await isDbAdmin(req.user.id))) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this avatar' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        const avatar_url = req.file.secure_url || req.file.path;
        const result = await getConvexClient().updateUser(id, { avatar_url, updated_at: new Date().toISOString() });

        if (!result) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: { avatar_url: result.avatar_url } });
    } catch (error) {
        logger.error('Error uploading avatar:', error);
        res.status(500).json({ success: false, message: 'Failed to upload avatar' });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    uploadAvatar
};
