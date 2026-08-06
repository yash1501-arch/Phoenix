const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth, adminOnly } = require('../middleware/auth');
const { getConvexClient } = require('../utils/convexClient');
const logger = require('../utils/logger');

// POST /api/contact — public submission
router.post('/', [
    check('name', 'Name is required').not().isEmpty().trim().isLength({ min: 2, max: 100 }),
    check('email', 'Valid email is required').isEmail().normalizeEmail(),
    check('phone').optional({ checkFalsy: true }).trim().isLength({ min: 10, max: 15 }),
    check('subject', 'Subject is required').not().isEmpty().trim().isLength({ max: 200 }),
    check('message', 'Message must be 10–5000 characters').isLength({ min: 10, max: 5000 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
        const { name, email, phone, subject, message } = req.body;
        await getConvexClient().submitContactMessage({
            name: name.trim(),
            email,
            phone: phone || undefined,
            subject: subject.trim(),
            message: message.trim(),
        });
        res.status(201).json({
            success: true,
            message: 'Message received. We typically reply within 24 hours on business days.',
        });
    } catch (error) {
        logger.error('contact.submit error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message. Please try WhatsApp instead.' });
    }
});

// GET /api/contact — admin list
router.get('/', auth, adminOnly, async (req, res) => {
    try {
        const messages = await getConvexClient().listContactMessages({
            status: req.query.status || undefined,
        });
        res.json({ success: true, data: messages });
    } catch (error) {
        logger.error('contact.list error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
});

// PUT /api/contact/:id/status — admin update status
router.put('/:id/status', auth, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['new', 'read', 'replied', 'archived'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        await getConvexClient().setContactMessageStatus(req.params.id, status);
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        logger.error('contact.setStatus error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

// DELETE /api/contact/:id — admin delete
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        await getConvexClient().deleteContactMessage(req.params.id);
        res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        logger.error('contact.delete error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
});

module.exports = router;
