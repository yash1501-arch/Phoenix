const express = require('express');
const router = express.Router();
const { auth, clerkOrAdmin } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const paymentController = require('../controllers/paymentController');

const paymentUpload = (req, res, next) => {
  req.cloudinaryFolder = 'phoenix_payments';
  req.cloudinaryPrivate = true;
  next();
};

router.post(
  '/manual/submit',
  auth,
  paymentUpload,
  ...uploadImage.single('screenshot'),
  paymentController.submitManual
);

router.get(
  '/admin/manual/pending',
  auth,
  clerkOrAdmin,
  paymentController.listPending
);

router.post(
  '/admin/manual/verify',
  auth,
  clerkOrAdmin,
  paymentController.verify
);

router.post(
  '/admin/manual/reject',
  auth,
  clerkOrAdmin,
  paymentController.reject
);

module.exports = router;
