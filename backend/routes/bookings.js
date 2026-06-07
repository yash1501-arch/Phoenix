const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { auth, adminOnly } = require('../middleware/auth');

// Get all bookings (Admin only)
router.get('/', auth, adminOnly, bookingController.getAllBookings);

// Get bookings for a specific user (authenticated users)
router.get('/user/:userId', auth, bookingController.getUserBookings);

// Get single booking by ID
router.get('/:id', auth, bookingController.getBookingById);

// Create a new booking (authenticated users)
router.post('/', auth, bookingController.createBooking);

// Cancel a booking (owner or admin)
router.post('/:id/cancel', auth, bookingController.cancelBooking);

// Update booking status (Admin only)
router.patch('/:id/status', auth, adminOnly, bookingController.updateBookingStatus);

module.exports = router;
