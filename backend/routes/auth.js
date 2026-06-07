const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { getConvexClient } = require('../utils/convexClient');
const logger = require('../utils/logger');

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not configured');
    }
    return secret;
};

// Helper function to find user by email (case-insensitive: stores + queries lowercase)
async function findUserByEmail(email) {
    try {
        return await getConvexClient().getUserByEmail(String(email).toLowerCase());
    } catch (error) {
        logger.error('Error finding user by email:', error);
        return null;
    }
}

// Register User
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase();

    try {
        // Check if user exists
        const existingUser = await findUserByEmail(normalizedEmail);

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user in users table
        const newUser = await getConvexClient().createUser({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'user',
            created_at: new Date().toISOString()
        });

        const payload = {
            user: {
                id: newUser._id, // Convex uses _id for the primary key
                name: name,
                email: normalizedEmail,
                role: 'user'
            }
        };

        const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
        res.json({ token });

    } catch (err) {
        logger.error('Register error:', err.response?.data || err.stack || err.message);
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'production' ? 'Server Error' : (err.response?.data?.errorMessage || err.message || 'Server Error'),
        });
    }
});

// Login User
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase();

    try {
        const user = await findUserByEmail(normalizedEmail);

        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        };

        const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
        res.json({ token });

    } catch (err) {
        logger.error('Login error:', err.response?.data || err.stack || err.message);
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'production' ? 'Server Error' : (err.response?.data?.errorMessage || err.message || 'Server Error'),
        });
    }
});

// Forgot Password — send reset link (stub: logs to console, no email provider yet)
router.post('/forgot-password', [
    check('email', 'Valid email required').isEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = await findUserByEmail(String(req.body.email).toLowerCase());
        // Always respond success to prevent email enumeration
        if (user) {
            const resetToken = jwt.sign({ id: user._id, purpose: 'reset' }, getJwtSecret(), { expiresIn: '1h' });
            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
            logger.info(`[PASSWORD RESET] ${req.body.email} -> ${resetLink}`);
            // TODO: send via email service
        }
        res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
    } catch (err) {
        logger.error('forgot-password error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Reset Password — consume token, set new password
router.post('/reset-password', [
    check('token', 'Token is required').not().isEmpty(),
    check('password', 'Password must be 8+ characters').isLength({ min: 8 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const decoded = jwt.verify(req.body.token, getJwtSecret());
        if (decoded.purpose !== 'reset') {
            return res.status(400).json({ success: false, message: 'Invalid token' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        await getConvexClient().updateUser(decoded.id, { password: hashedPassword, updated_at: new Date().toISOString() });
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({ success: false, message: 'Reset link has expired' });
        }
        logger.error('reset-password error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Current User
router.get('/me', auth, async (req, res) => {
    try {
        const user = await getConvexClient().getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Change Password (authenticated)
router.post('/change-password', [
    auth,
    check('current_password', 'Current password is required').not().isEmpty(),
    check('new_password', 'New password must be 8+ characters').isLength({ min: 8 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
        const { current_password, new_password } = req.body;
        const user = await getConvexClient().getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(current_password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);
        await getConvexClient().updateUser(req.user.id, { password: hashedPassword, updated_at: new Date().toISOString() });
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        logger.error('change-password error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;