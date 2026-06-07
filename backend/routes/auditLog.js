const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/auditLogController');

router.get('/', auth, adminOnly, ctrl.list);

module.exports = router;
