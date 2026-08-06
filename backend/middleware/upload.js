const multer = require('multer');
const { uploadImageBuffer } = require('../utils/cloudinaryClient');
require('dotenv').config();

const memoryStorage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  cb(new Error(`Only image files are allowed! Uploaded: ${file.originalname}`));
};

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'));
  }
};

const memoryImage = multer({
  storage: memoryStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadPDF = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: pdfFilter,
});

async function pushToCloudinary(req, res, next) {
  try {
    const folder = req.cloudinaryFolder || 'phoenix_adventures';
    const isPrivate = Boolean(req.cloudinaryPrivate);

    if (req.file?.buffer) {
      const result = await uploadImageBuffer(req.file.buffer, req.file.mimetype, { folder, private: isPrivate });
      req.file.secure_url = result.secure_url;
      req.file.path = result.secure_url;
      req.file.public_id = result.public_id;
    }

    if (Array.isArray(req.files) && req.files.length > 0) {
      await Promise.all(
        req.files.map(async (file) => {
          const result = await uploadImageBuffer(file.buffer, file.mimetype, { folder, private: isPrivate });
          file.secure_url = result.secure_url;
          file.path = result.secure_url;
          file.public_id = result.public_id;
        })
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/** Single image field → Cloudinary */
const uploadImage = {
  single: (field) => [memoryImage.single(field), pushToCloudinary],
};

/** Multiple images → Cloudinary */
const uploadImages = {
  array: (field, maxCount) => [memoryImage.array(field, maxCount), pushToCloudinary],
};

module.exports = {
  uploadImage,
  uploadPDF,
  uploadImages,
};
