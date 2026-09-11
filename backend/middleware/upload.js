require('dotenv').config();
const multer = require('multer');
const { uploadImageBuffer, uploadRawBuffer } = require('../utils/cloudinaryClient');

const memoryStorage = multer.memoryStorage();

const BLOCKED_MIMETYPES = new Set(['image/svg+xml', 'image/svg']);

const MAGIC = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header; WEBP at offset 8
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

function matchesMagic(buffer, signatures) {
  if (!buffer || buffer.length < 4) return false;
  return signatures.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}

function validateBufferMagic(buffer, mimetype) {
  const signatures = MAGIC[mimetype];
  if (!signatures) return false;
  if (!matchesMagic(buffer, signatures)) return false;
  if (mimetype === 'image/webp' && buffer.length >= 12) {
    return buffer.slice(8, 12).toString('ascii') === 'WEBP';
  }
  return true;
}

function validateUploadedFile(file) {
  if (!file?.buffer || !file.mimetype) {
    return 'Invalid file upload';
  }
  if (BLOCKED_MIMETYPES.has(file.mimetype)) {
    return 'SVG uploads are not allowed';
  }
  if (file.mimetype.startsWith('image/')) {
    if (!MAGIC[file.mimetype]) {
      return `Image type not allowed: ${file.mimetype}`;
    }
    if (!validateBufferMagic(file.buffer, file.mimetype)) {
      return `File content does not match declared type (${file.mimetype})`;
    }
    return null;
  }
  if (file.mimetype === 'application/pdf') {
    if (!validateBufferMagic(file.buffer, file.mimetype)) {
      return 'File content does not match declared type (application/pdf)';
    }
    return null;
  }
  return `File type not allowed: ${file.mimetype}`;
}

const imageFilter = (req, file, cb) => {
  if (BLOCKED_MIMETYPES.has(file.mimetype)) {
    return cb(new Error('SVG uploads are not allowed'));
  }
  if (file.mimetype && file.mimetype.startsWith('image/') && MAGIC[file.mimetype]) {
    return cb(null, true);
  }
  cb(new Error(`Only JPEG, PNG, GIF, and WebP images are allowed. Uploaded: ${file.originalname}`));
};

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'));
  }
};

const adventureFileFilter = (req, file, cb) => {
  if (file.fieldname === 'image') return imageFilter(req, file, cb);
  if (file.fieldname === 'confirmation_pdf') return pdfFilter(req, file, cb);
  return cb(new Error(`Unexpected upload field: ${file.fieldname}`));
};

function assertValidFiles(req) {
  const files = [];
  if (req.file?.buffer) files.push(req.file);
  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === 'object') {
    for (const arr of Object.values(req.files)) {
      if (Array.isArray(arr)) files.push(...arr);
    }
  }
  for (const file of files) {
    const err = validateUploadedFile(file);
    if (err) {
      const error = new Error(err);
      error.status = 400;
      throw error;
    }
  }
}

const memoryImage = multer({
  storage: memoryStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const memoryAdventure = multer({
  storage: memoryStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: adventureFileFilter,
});

const uploadPDF = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: pdfFilter,
});

async function pushToCloudinary(req, res, next) {
  try {
    assertValidFiles(req);
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
    const msg = err?.message || String(err);
    if (err.status === 400) {
      return res.status(400).json({ success: false, message: msg });
    }
    if (/cloudinary|cloud_name|not configured/i.test(msg)) {
      return res.status(503).json({
        success: false,
        message: msg,
      });
    }
    next(err);
  }
}

async function pushAdventureFilesToCloudinary(req, res, next) {
  try {
    assertValidFiles(req);
    const imageFile = req.files?.image?.[0];
    const pdfFile = req.files?.confirmation_pdf?.[0];

    if (imageFile?.buffer) {
      const result = await uploadImageBuffer(imageFile.buffer, imageFile.mimetype, {
        folder: 'phoenix_adventures',
      });
      req.file = {
        ...imageFile,
        secure_url: result.secure_url,
        path: result.secure_url,
        public_id: result.public_id,
      };
    }

    if (pdfFile?.buffer) {
      const result = await uploadRawBuffer(pdfFile.buffer, pdfFile.mimetype, {
        folder: 'phoenix_confirmations',
      });
      req.confirmationPdf = {
        secure_url: result.secure_url,
        public_id: result.public_id,
      };
    }

    next();
  } catch (err) {
    const msg = err?.message || String(err);
    if (err.status === 400) {
      return res.status(400).json({ success: false, message: msg });
    }
    if (/cloudinary|cloud_name|not configured/i.test(msg)) {
      return res.status(503).json({
        success: false,
        message: msg,
      });
    }
    next(err);
  }
}

/** Single image field → Cloudinary */
const uploadImage = {
  single: (field) => [memoryImage.single(field), pushToCloudinary],
};

/** Adventure create/update: cover image + confirmation PDF */
const uploadAdventure = {
  fields: () => [
    memoryAdventure.fields([
      { name: 'image', maxCount: 1 },
      { name: 'confirmation_pdf', maxCount: 1 },
    ]),
    pushAdventureFilesToCloudinary,
  ],
};

/** Multiple images → Cloudinary */
const uploadImages = {
  array: (field, maxCount) => [memoryImage.array(field, maxCount), pushToCloudinary],
};

module.exports = {
  uploadImage,
  uploadAdventure,
  uploadPDF,
  uploadImages,
};
