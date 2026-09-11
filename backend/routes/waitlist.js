const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const ctrl = require('../controllers/waitlistController');

router.post('/', optionalAuth, ctrl.join);

module.exports = router;
