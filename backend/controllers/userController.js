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
        if (!avatar_url) {
            return res.status(502).json({ success: false, message: 'Image upload did not return a URL' });
        }

        const result = await getConvexClient().updateUser(id, { avatar_url });

        if (!result) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: { avatar_url: result.avatar_url || avatar_url } });
    } catch (error) {
        const msg = error?.message || String(error);
        logger.error('Error uploading avatar:', { message: msg, stack: error?.stack });

        if (/cloudinary|cloud_name|not configured/i.test(msg)) {
            return res.status(503).json({
                success: false,
                message: 'Image upload service is not configured',
            });
        }
        if (/ArgumentValidationError|extra field|validator/i.test(msg)) {
            return res.status(500).json({
                success: false,
                message: 'Server could not save profile photo — redeploy Convex functions',
            });
        }

        res.status(500).json({ success: false, message: 'Failed to upload avatar' });
    }
};

const setRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = String(req.body.role || '').trim();
        const { isValidRole } = require('../utils/roles');
        if (!isValidRole(role)) {
            return res.status(400).json({ success: false, message: 'role must be admin, clerk, or user' });
        }
        if (String(id) === String(req.user.id) && role !== 'admin') {
            return res.status(400).json({ success: false, message: 'You cannot remove your own admin role' });
        }
        const existing = await getConvexClient().getUserById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        await getConvexClient().updateUser(id, { role });
        getConvexClient().logAudit({
            actor_id: req.user.id,
            actor_email: req.user.email,
            action: 'user.role_change',
            target_type: 'user',
            target_id: id,
            metadata: { from: existing.role, to: role, email: existing.email },
        }).catch((err) => logger.error('Audit log failed:', err.message));
        return res.json({ success: true, message: `Role updated to ${role}` });
    } catch (error) {
        logger.error('setRole error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update role' });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    uploadAvatar,
    setRole,
};
