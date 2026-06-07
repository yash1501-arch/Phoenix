const express = require('express');
const router = express.Router();
const razorpay = require('../config/razorpay');
const { verifyRazorpaySignature } = require('../config/razorpay');
const { auth } = require('../middleware/auth');
const { getConvexClient } = require('../utils/convexClient');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

async function getExpectedAmount(booking) {
    const candidate = booking.advance_paid ?? booking.total_amount;
    const n = Number(candidate);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100);
}

async function fetchBookingOr404(bookingId, res) {
    if (!bookingId || typeof bookingId !== 'string') {
        res.status(400).json({ success: false, message: 'bookingId is required' });
        return null;
    }
    try {
        const booking = await getConvexClient().getBookingById(bookingId);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return null;
        }
        return booking;
    } catch (err) {
        logger.error('Error fetching booking:', err);
        res.status(500).json({ success: false, message: 'Failed to load booking' });
        return null;
    }
}

async function alreadyProcessed(bookingId, transactionId) {
    try {
        const existing = await getConvexClient().getPaymentsByBookingId(bookingId);
        const list = Array.isArray(existing) ? existing : (existing?.data || []);
        return list.some((p) => p.transaction_id === transactionId);
    } catch (err) {
        logger.error('Error checking existing payments:', err);
        return false;
    }
}

async function fulfillBooking(booking, razorpayPaymentId, amountPaise) {
    const client = getConvexClient();

    if (booking.status !== 'confirmed') {
        await client.updateBookingStatus(booking._id || booking.id, 'confirmed');
    }

    if (await alreadyProcessed(booking._id || booking.id, razorpayPaymentId)) {
        return;
    }

    await client.createPayment({
        booking_id: booking._id || booking.id,
        amount: typeof amountPaise === 'number' ? amountPaise / 100 : (booking.advance_paid || booking.total_amount),
        currency: 'INR',
        status: 'completed',
        payment_method: 'razorpay',
        transaction_id: razorpayPaymentId,
    });

    try {
        const user = await client.getUserById(booking.user_id);
        const adventure = await client.getAdventureById(booking.adventure_id);
        if (!user || !adventure) return;

        const bookingDetails = {
            date: new Date(booking.booking_date).toLocaleDateString(),
            participants: booking.participants,
            amountPaid: typeof amountPaise === 'number' ? amountPaise / 100 : (booking.advance_paid || booking.total_amount),
            idType: booking.id_type || 'N/A',
            idNumber: booking.id_number || 'N/A',
        };
        await emailService.sendBookingConfirmation(user.email, user.name, adventure.title, bookingDetails);
        if (process.env.ADMIN_EMAIL) {
            await emailService.sendAdminAlert(process.env.ADMIN_EMAIL, user.name, adventure.title, bookingDetails);
        }
    } catch (mailErr) {
        logger.error('Non-fatal: confirmation email failed:', mailErr);
    }
}

router.post('/create-order', auth, async (req, res) => {
    if (!razorpay) {
        return res.status(503).json({
            success: false,
            message: 'Payment service is currently unavailable. Please contact support.'
        });
    }

    const { bookingId, currency = 'INR' } = req.body;

    const booking = await fetchBookingOr404(bookingId, res);
    if (!booking) return;

    const expectedPaise = await getExpectedAmount(booking);
    if (expectedPaise === null) {
        return res.status(400).json({ success: false, message: 'Booking has no valid payable amount' });
    }

    try {
        // Razorpay caps `receipt` at 40 chars. Convex IDs are ~30 chars, so
        // naively concatenating "booking_<id>_<timestamp>" blows the limit and
        // Razorpay rejects the order with BAD_REQUEST_ERROR. Build a short,
        // unique, sortable receipt: last 8 of booking id + base36 timestamp.
        const idTail = String(booking._id || booking.id || '').slice(-8);
        const ts = Date.now().toString(36);
        const receipt = `bkg_${idTail}_${ts}`.slice(0, 40);

        const order = await razorpay.orders.create({
            amount: expectedPaise,
            currency,
            receipt,
            notes: { booking_id: booking._id || booking.id },
        });
        res.json(order);
    } catch (error) {
        logger.error('Razorpay order create error:', error);
        res.status(500).json({ success: false, message: 'Error creating Razorpay order' });
    }
});

router.post('/verify-payment', auth, async (req, res) => {
    if (!razorpay) {
        return res.status(503).json({
            success: false,
            message: 'Payment service is currently unavailable. Please contact support.'
        });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Missing payment response fields' });
    }

    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const booking = await fetchBookingOr404(bookingId, res);
    if (!booking) return;

    let order;
    try {
        order = await razorpay.orders.fetch(razorpay_order_id);
    } catch (err) {
        logger.error('Order fetch failed during verify:', err);
        return res.status(400).json({ success: false, message: 'Could not verify order with Razorpay' });
    }

    const orderBookingId = order.notes?.booking_id;
    if (!orderBookingId || orderBookingId !== (booking._id || booking.id)) {
        logger.warn(`Order/booking mismatch: order=${razorpay_order_id} orderBookingId=${orderBookingId} submittedBookingId=${booking._id || booking.id}`);
        return res.status(400).json({ success: false, message: 'Order does not match booking' });
    }

    if (order.status !== 'paid') {
        return res.status(400).json({ success: false, message: `Order is not paid (status: ${order.status})` });
    }

    const expectedPaise = await getExpectedAmount(booking);
    if (expectedPaise === null) {
        return res.status(400).json({ success: false, message: 'Booking has no valid payable amount' });
    }
    if (typeof order.amount !== 'number' || order.amount !== expectedPaise) {
        logger.warn(`Amount mismatch: order=${order.amount} expected=${expectedPaise} bookingId=${booking._id || booking.id}`);
        return res.status(400).json({ success: false, message: 'Payment amount does not match booking' });
    }

    try {
        await fulfillBooking(booking, razorpay_payment_id, order.amount);
        res.json({ success: true, message: 'Payment verified successfully' });
    } catch (dbError) {
        logger.error('Error updating booking after payment:', dbError);
        res.status(500).json({ success: false, message: 'Payment verified but failed to update booking status' });
    }
});

module.exports = router;
