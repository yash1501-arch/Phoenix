const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { getConvexClient } = require('../utils/convexClient');
const { sendPasswordReset } = require('../services/emailService');
const { setAuthCookie, clearAuthCookie } = require('../utils/authCookie');
const { sanitizeUser } = require('../utils/sanitizeUser');
const { getJwtSecret, signAuthToken } = require('../utils/jwtHelpers');
const logger = require('../utils/logger');

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
    check('name', 'Name is required').not().isEmpty().trim().isLength({ min: 2, max: 100 }),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password must be 8+ characters').isLength({ min: 8, max: 128 })
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

        const token = signAuthToken(newUser);
        setAuthCookie(res, token, 'user');
        res.json({
            success: true,
            user: {
                id: newUser._id,
                name,
                email: normalizedEmail,
                role: 'user',
            },
        });

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
                role: user.role,
                session_version: user.session_version ?? 0,
            }
        };

        if (user.role === 'admin' && user.totp_enabled && user.totp_secret) {
            const challengeToken = jwt.sign(
                { id: user._id, purpose: '2fa' },
                getJwtSecret(),
                { expiresIn: '5m' }
            );
            return res.json({
                success: true,
                requires2fa: true,
                challengeToken,
            });
        }

        const token = signAuthToken(user);
        setAuthCookie(res, token, user.role);
        res.json({
            success: true,
            user: payload.user,
            requires2faSetup: user.role === 'admin' && !(user.totp_enabled && user.totp_secret),
        });

    } catch (err) {
        logger.error('Login error:', err.response?.data || err.stack || err.message);
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'production' ? 'Server Error' : (err.response?.data?.errorMessage || err.message || 'Server Error'),
        });
    }
});

// Forgot Password — email a one-hour reset link
router.post('/forgot-password', [
    check('email', 'Valid email required').isEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const email = String(req.body.email).toLowerCase();
        const user = await findUserByEmail(email);
        // Always respond success to prevent email enumeration
        if (user) {
            const resetToken = jwt.sign(
                { id: user._id, purpose: 'reset' },
                getJwtSecret(),
                { expiresIn: '1h' }
            );
            const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
            const resetLink = `${frontendBase}/reset-password?token=${encodeURIComponent(resetToken)}`;

            logger.info(`[PASSWORD RESET] Reset requested for ${email}`);

            try {
                await sendPasswordReset(user.email, user.name, resetLink);
            } catch (mailErr) {
                logger.error('Password reset email failed:', mailErr.message || mailErr);
                if (process.env.NODE_ENV !== 'production') {
                    logger.info(`[PASSWORD RESET] Dev reset link for ${email}: ${resetLink}`);
                }
            }
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
        if (decoded.purpose !== 'reset' || !decoded.id) {
            return res.status(400).json({ success: false, message: 'Invalid token' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        // users:update only accepts name/email/password/role — updated_at set inside Convex
        await getConvexClient().updateUser(decoded.id, { password: hashedPassword });
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({ success: false, message: 'Reset link has expired' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(400).json({ success: false, message: 'Invalid or malformed reset link' });
        }
        logger.error('reset-password error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Logout — clear httpOnly session cookie
router.post('/logout', (req, res) => {
    clearAuthCookie(res);
    res.json({ success: true });
});

// Complete admin login after TOTP challenge
router.post('/2fa/verify-login', [
    check('challengeToken', 'Challenge token is required').not().isEmpty(),
    check('code', '6-digit code is required').isLength({ min: 6, max: 8 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const decoded = jwt.verify(req.body.challengeToken, getJwtSecret());
        if (decoded.purpose !== '2fa' || !decoded.id) {
            return res.status(400).json({ success: false, message: 'Invalid challenge' });
        }

        const user = await getConvexClient().getUserById(decoded.id);
        if (!user || user.role !== 'admin' || !user.totp_enabled || !user.totp_secret) {
            return res.status(400).json({ success: false, message: '2FA is not enabled for this account' });
        }

        const { verifyTotp } = require('../utils/totp');
        if (!verifyTotp(user.totp_secret, req.body.code)) {
            return res.status(401).json({ success: false, message: 'Invalid authentication code' });
        }

        const payload = {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                session_version: user.session_version ?? 0,
            },
        };
        const token = signAuthToken(user);
        setAuthCookie(res, token, user.role);
        return res.json({ success: true, user: payload.user });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({ success: false, message: 'Login challenge expired. Please sign in again.' });
        }
        logger.error('2fa verify-login error:', err.message);
        return res.status(400).json({ success: false, message: 'Invalid challenge' });
    }
});

// Admin 2FA status
router.get('/2fa/status', auth, async (req, res) => {
    try {
        const user = await getConvexClient().getUserById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin only' });
        }
        return res.json({
            success: true,
            data: { enabled: Boolean(user.totp_enabled && user.totp_secret) },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch 2FA status' });
    }
});

// Begin 2FA setup — returns secret + QR for authenticator app
router.post('/2fa/setup', auth, async (req, res) => {
    try {
        const user = await getConvexClient().getUserById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin only' });
        }

        const { generateSecret, buildOtpAuthUrl } = require('../utils/totp');
        const QRCode = require('qrcode');
        const secret = generateSecret();
        const otpauthUrl = buildOtpAuthUrl(user.email, secret);
        const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

        return res.json({
            success: true,
            data: { secret, otpauthUrl, qrDataUrl },
        });
    } catch (err) {
        logger.error('2fa setup error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to start 2FA setup' });
    }
});

// Enable 2FA after verifying a code from the authenticator app
router.post('/2fa/enable', [
    auth,
    check('secret', 'Secret is required').not().isEmpty(),
    check('code', '6-digit code is required').isLength({ min: 6, max: 8 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const user = await getConvexClient().getUserById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin only' });
        }

        const { verifyTotp } = require('../utils/totp');
        if (!verifyTotp(req.body.secret, req.body.code)) {
            return res.status(400).json({ success: false, message: 'Invalid authentication code' });
        }

        await getConvexClient().setUserTotp(user._id, req.body.secret, true);
        return res.json({ success: true, message: 'Two-factor authentication enabled' });
    } catch (err) {
        logger.error('2fa enable error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to enable 2FA' });
    }
});

// Disable 2FA
router.post('/2fa/disable', [
    auth,
    check('code', '6-digit code is required').isLength({ min: 6, max: 8 }),
    check('password', 'Password is required').exists(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const user = await getConvexClient().getUserById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin only' });
        }
        if (!user.totp_enabled || !user.totp_secret) {
            return res.status(400).json({ success: false, message: '2FA is not enabled' });
        }

        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Password is incorrect' });
        }

        const { verifyTotp } = require('../utils/totp');
        if (!verifyTotp(user.totp_secret, req.body.code)) {
            return res.status(400).json({ success: false, message: 'Invalid authentication code' });
        }

        await getConvexClient().clearUserTotp(user._id);
        return res.json({ success: true, message: 'Two-factor authentication disabled' });
    } catch (err) {
        logger.error('2fa disable error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to disable 2FA' });
    }
});

// Get Current User
router.get('/me', auth, async (req, res) => {
    try {
        const user = await getConvexClient().getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const safeUser = sanitizeUser(user);
        const requires2faSetup =
            safeUser.role === 'admin' && !(user.totp_enabled && user.totp_secret);
        res.json({
            ...safeUser,
            requires2faSetup,
            user: {
                id: safeUser.id,
                name: safeUser.name,
                email: safeUser.email,
                role: safeUser.role,
            },
        });
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
        await getConvexClient().updateUser(req.user.id, { password: hashedPassword });
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        logger.error('change-password error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;