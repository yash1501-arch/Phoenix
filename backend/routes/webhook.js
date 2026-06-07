const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const { safeTimingEqual } = require('../config/razorpay');
const { getConvexClient } = require('../utils/convexClient');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

module.exports = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
        logger.error('Webhook received but RAZORPAY_WEBHOOK_SECRET is not configured — rejecting.');
        return res.status(503).send('Webhook secret not configured');
    }

    const signature = req.headers['x-razorpay-signature'];

    if (!signature || !Buffer.isBuffer(req.body)) {
        return res.status(400).send('Invalid request');
    }

    let payloadStr;
    try {
        payloadStr = req.body.toString('utf8');
    } catch {
        return res.status(400).send('Invalid body');
    }

    const expectedSignature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

    if (!safeTimingEqual(expectedSignature, signature)) {
        return res.status(400).send('Invalid signature');
    }

    let payloadObj;
    try {
        payloadObj = JSON.parse(payloadStr);
    } catch {
        return res.status(400).send('Invalid JSON');
    }

    const event = payloadObj.event;

    if (event !== 'payment.captured' && event !== 'order.paid') {
        return res.status(200).json({ status: 'ignored' });
    }

    try {
        const payment = payloadObj.payload?.payment?.entity;
        if (!payment || !payment.order_id) {
            return res.status(200).json({ status: 'no_order' });
        }

        const order = await razorpay.orders.fetch(payment.order_id);
        const bookingId = order.notes?.booking_id;

        if (!bookingId) {
            logger.warn(`Webhook: no booking_id in order notes for order ${payment.order_id}`);
            return res.status(200).json({ status: 'no_booking' });
        }

        const client = getConvexClient();
        const booking = await client.getBookingById(bookingId);
        if (!booking) {
            logger.warn(`Webhook: booking ${bookingId} not found`);
            return res.status(200).json({ status: 'booking_not_found' });
        }

        const expectedPaise = Math.round(Number(booking.advance_paid ?? booking.total_amount) * 100);
        if (!Number.isFinite(expectedPaise) || expectedPaise <= 0) {
            logger.warn(`Webhook: booking ${bookingId} has invalid payable amount`);
            return res.status(200).json({ status: 'invalid_amount' });
        }
        if (typeof payment.amount !== 'number' || payment.amount !== expectedPaise) {
            logger.warn(`Webhook: amount mismatch order=${payment.order_id} paid=${payment.amount} expected=${expectedPaise}`);
            return res.status(200).json({ status: 'amount_mismatch' });
        }

        const existingPayments = await client.getPaymentsByBookingId(bookingId);
        const existingList = Array.isArray(existingPayments) ? existingPayments : (existingPayments?.data || []);
        if (existingList.some((p) => p.transaction_id === payment.id)) {
            return res.status(200).json({ status: 'already_processed' });
        }

        if (booking.status !== 'confirmed') {
            await client.updateBookingStatus(bookingId, 'confirmed');
        }

        await client.createPayment({
            booking_id: bookingId,
            amount: payment.amount / 100,
            currency: payment.currency || 'INR',
            status: 'completed',
            payment_method: 'razorpay',
            transaction_id: payment.id,
        });

        try {
            const user = await client.getUserById(booking.user_id);
            const adventure = await client.getAdventureById(booking.adventure_id);
            if (user && adventure) {
                const bookingDetails = {
                    date: new Date(booking.booking_date).toLocaleDateString(),
                    participants: booking.participants,
                    amountPaid: payment.amount / 100,
                    idType: booking.id_type || 'N/A',
                    idNumber: booking.id_number || 'N/A',
                };
                await emailService.sendBookingConfirmation(user.email, user.name, adventure.title, bookingDetails);
                if (process.env.ADMIN_EMAIL) {
                    await emailService.sendAdminAlert(process.env.ADMIN_EMAIL, user.name, adventure.title, bookingDetails);
                }
            }
        } catch (mailErr) {
            logger.error('Webhook: non-fatal email error:', mailErr);
        }

        res.status(200).json({ status: 'ok' });
    } catch (err) {
        logger.error('Webhook handler error:', err);
        res.status(500).send('Webhook Error');
    }
};
