const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/settingsController');

// Public read for non-sensitive keys (e.g. instagram_posts, instagram_handle)
router.get('/public', ctrl.getPublic);

router.get('/', auth, adminOnly, ctrl.getAll);
router.put('/', auth, adminOnly, ctrl.set);

module.exports = router;
