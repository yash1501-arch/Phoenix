const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/reviewController');

router.post('/', auth, ctrl.addReview);
router.get('/adventure/:adventureId', ctrl.getReviewsForAdventure);
router.get('/user/:userId', auth, ctrl.getUserReviews);
router.get('/summary/:adventureId', ctrl.getRatingSummary);
router.put('/:id/approve', auth, adminOnly, ctrl.approveReview);
router.delete('/:id', auth, adminOnly, ctrl.deleteReview);

module.exports = router;
