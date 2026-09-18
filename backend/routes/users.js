const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const userController = require('../controllers/userController');
const { auth, adminOnly } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

// Get all users (Admin only)
router.get('/', auth, adminOnly, userController.getUsers);

// Create admin/clerk account (Admin only)
router.post(
  '/staff',
  auth,
  adminOnly,
  [
    check('name', 'Name is required').not().isEmpty().trim().isLength({ min: 2, max: 100 }),
    check('email', 'Valid email required').isEmail().normalizeEmail(),
    check('password', 'Password must be 8+ characters').isLength({ min: 8, max: 128 }),
    check('role', 'role must be admin or clerk').isIn(['admin', 'clerk']),
  ],
  userController.createStaff
);

// Get user by ID (authenticated)
router.get('/:id', auth, userController.getUserById);

// Update user by ID (authenticated)
router.put('/:id/role', auth, adminOnly, userController.setRole);
router.put('/:id', auth, userController.updateUser);

// Upload avatar (authenticated, owner only)
router.post(
    '/:id/avatar',
    auth,
    (req, _res, next) => {
        req.cloudinaryFolder = 'phoenix_adventures/avatars';
        next();
    },
    ...uploadImage.single('avatar'),
    userController.uploadAvatar
);

module.exports = router;
