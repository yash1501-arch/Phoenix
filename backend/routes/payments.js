const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
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
  adminOnly,
  paymentController.listPending
);

router.post(
  '/admin/manual/verify',
  auth,
  adminOnly,
  paymentController.verify
);

router.post(
  '/admin/manual/reject',
  auth,
  adminOnly,
  paymentController.reject
);

module.exports = router;
