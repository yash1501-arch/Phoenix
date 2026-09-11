const express = require('express');
const router = express.Router();
const { auth, clerkOrAdmin } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.get('/overview', auth, clerkOrAdmin, dashboardController.getOverview);

module.exports = router;
