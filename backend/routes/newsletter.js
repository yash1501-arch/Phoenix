const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/newsletterController');

router.post('/subscribe', ctrl.subscribe);
router.post('/unsubscribe', ctrl.unsubscribe);
router.get('/', auth, adminOnly, ctrl.getAll);

module.exports = router;
