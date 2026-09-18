const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');

router.get('/adventure/:id', shareController.getAdventureSharePage);

module.exports = router;
