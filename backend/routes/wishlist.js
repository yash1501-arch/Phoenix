const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/wishlistController');

router.post('/', auth, ctrl.add);
router.delete('/', auth, ctrl.remove);
router.get('/user/:userId', auth, ctrl.getByUser);
router.get('/check', auth, ctrl.isWishlisted);

module.exports = router;
