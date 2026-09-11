const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, adminOnly } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

// Get all users (Admin only)
router.get('/', auth, adminOnly, userController.getUsers);

// Get user by ID (authenticated)
router.get('/:id', auth, userController.getUserById);

// Update user by ID (authenticated)
router.put('/:id/role', auth, adminOnly, userController.setRole);
router.put('/:id', auth, userController.updateUser);

// Upload avatar (authenticated, owner only)
router.post('/:id/avatar', auth, ...uploadImage.single('avatar'), userController.uploadAvatar);

module.exports = router;
