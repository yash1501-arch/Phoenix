const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

router.post('/manual', auth, bookingController.createManual);
router.get('/user/:userId', auth, bookingController.getUserBookings);

// Admin routes before parameterized routes
router.get('/admin/all', auth, adminOnly, bookingController.adminListAll);
router.post('/admin/:bookingId/release', auth, adminOnly, bookingController.adminRelease);

router.get('/:bookingId/payment', auth, bookingController.getPaymentDetails);
router.get('/:bookingId', auth, bookingController.getById);

module.exports = router;
