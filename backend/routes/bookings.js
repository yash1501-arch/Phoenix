const express = require('express');
const router = express.Router();
const { auth, clerkOrAdmin } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

router.post('/manual', auth, bookingController.createManual);
router.post('/:bookingId/cancel', auth, bookingController.cancelByUser);
router.get('/:bookingId/itinerary.pdf', auth, bookingController.downloadCustomerItinerary);
router.get('/user/:userId', auth, bookingController.getUserBookings);

// Admin routes before parameterized routes
router.get('/admin/all', auth, clerkOrAdmin, bookingController.adminListAll);
router.post('/admin/:bookingId/release', auth, clerkOrAdmin, bookingController.adminRelease);

router.get('/:bookingId/payment', auth, bookingController.getPaymentDetails);
router.get('/:bookingId', auth, bookingController.getById);

module.exports = router;
