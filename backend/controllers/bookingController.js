const { getConvexClient } = require('../utils/convexClient');
const logger = require('../utils/logger');
require('dotenv').config();

/**
 * Get all bookings (Admin)
 */
const getAllBookings = async (req, res) => {
    try {
        const { status } = req.query;

        const result = await getConvexClient().getBookings({ status });

        res.json(result);
    } catch (error) {
        logger.error('Error fetching bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
};

/**
 * Get bookings for a specific user
 */
const getUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await getConvexClient().getBookingsByUser(userId);

        res.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        logger.error('Error fetching user bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user bookings' });
    }
};

/**
 * Get single booking by ID
 */
const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getConvexClient().getBookingById(id);

        if (!result) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Error fetching booking:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch booking' });
    }
};

/**
 * Create a new booking
 */
const createBooking = async (req, res) => {
    try {
        const bookingData = req.body;

        // Basic validation
        if (!bookingData.user_id || !bookingData.adventure_id || !bookingData.booking_date) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Validate date format and ensure it's not in the past
        const parsedDate = new Date(bookingData.booking_date);
        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid booking date' });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsedDate < today) {
            return res.status(400).json({ success: false, message: 'Booking date cannot be in the past' });
        }

        // Normalize to YYYY-MM-DD for date-list comparison
        const requestedDate = bookingData.booking_date.length >= 10
            ? bookingData.booking_date.slice(0, 10)
            : `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;

        // Validate the requested date is one of the admin-defined available dates
        let adventure = null;
        try {
            adventure = await getConvexClient().getAdventureById(bookingData.adventure_id);
        } catch (err) {
            logger.error('Failed to fetch adventure for date validation:', err);
        }
        if (!adventure) {
            return res.status(404).json({ success: false, message: 'Adventure not found' });
        }
        const { normalizeAvailableDates, filterFutureDates } = require('./adventureController');
        const availableDates = normalizeAvailableDates(adventure.available_dates);
        const futureDates = filterFutureDates(availableDates);
        if (availableDates.length === 0) {
            return res.status(400).json({ success: false, message: 'This adventure has no scheduled dates yet' });
        }
        if (!futureDates.includes(requestedDate)) {
            return res.status(400).json({ success: false, message: 'Selected date is not available for booking' });
        }

        // Carry the canonical YYYY-MM-DD forward so downstream code is consistent
        bookingData.booking_date = requestedDate;

        // Normalize numeric fields
        const participants = Number(bookingData.participants);
        if (!Number.isFinite(participants) || participants < 1) {
            return res.status(400).json({ success: false, message: 'Participants must be at least 1' });
        }
        bookingData.participants = participants;

        const totalAmount = Number(bookingData.total_amount);
        if (!Number.isFinite(totalAmount) || totalAmount < 0) {
            return res.status(400).json({ success: false, message: 'Total amount must be a valid number' });
        }
        bookingData.total_amount = totalAmount;

        if (bookingData.advance_paid !== undefined && bookingData.advance_paid !== null && bookingData.advance_paid !== '') {
            const advancePaid = Number(bookingData.advance_paid);
            if (!Number.isFinite(advancePaid) || advancePaid < 0 || advancePaid > totalAmount) {
                return res.status(400).json({ success: false, message: 'Advance paid must be between 0 and total amount' });
            }
            bookingData.advance_paid = advancePaid;
        } else {
            delete bookingData.advance_paid;
        }

        // Default status if missing
        if (!bookingData.status) {
            bookingData.status = 'pending';
        }

        const result = await getConvexClient().createBooking(bookingData);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error creating booking:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create booking',
            error: process.env.NODE_ENV === 'production' ? undefined : error.message,
            details: process.env.NODE_ENV === 'production' ? undefined : (error.response?.data || error.toString())
        });
    }
};

/**
 * Update booking status (Admin)
 */
const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const result = await getConvexClient().updateBooking(id, { status });
        // Audit log
        try {
            await getConvexClient().callFunction('auditLog:log', {
                actor_id: req.user?.id,
                actor_email: req.user?.email,
                action: `booking.${status}`,
                target_type: 'booking',
                target_id: id,
                metadata: { previous: req.body.previous_status },
            });
        } catch { /* non-fatal */ }
        res.json({
            success: true,
            message: 'Booking status updated',
            data: result
        });
    } catch (error) {
        logger.error('Error updating booking status:', error);
        res.status(500).json({ success: false, message: 'Failed to update booking status' });
    }
};

/**
 * Cancel a booking (User) — soft cancel with reason
 */
const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body || {};
        const result = await getConvexClient().updateBooking(id, {
            status: 'cancelled',
            cancellation_reason: reason || 'user_request',
            cancelled_at: new Date().toISOString(),
        });
        try {
            await getConvexClient().callFunction('auditLog:log', {
                actor_id: req.user?.id,
                actor_email: req.user?.email,
                action: 'booking.cancel',
                target_type: 'booking',
                target_id: id,
                metadata: { reason: reason || 'user_request' },
            });
        } catch { /* non-fatal */ }
        res.json({ success: true, message: 'Booking cancelled', data: result });
    } catch (error) {
        logger.error('Error cancelling booking:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel booking' });
    }
};

module.exports = {
    getAllBookings,
    getUserBookings,
    getBookingById,
    createBooking,
    updateBookingStatus,
    cancelBooking,
};