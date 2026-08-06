const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.get('/overview', auth, adminOnly, dashboardController.getOverview);

module.exports = router;
