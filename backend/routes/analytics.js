const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.post('/visit', analyticsController.recordVisit);

module.exports = router;
