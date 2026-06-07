const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage for images (Cloudinary)
const imageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'phoenix_adventures',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
        transformation: [{ width: 1920, height: 1080, crop: 'limit', quality: 'auto' }] // Optimize
    }
});

// Configure storage for PDFs (Memory - ephemeral processing only)
const pdfStorage = multer.memoryStorage();

// File filter for images
const imageFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'image/heic', 'image/heif',
    ];
    const allowedExts = /\.(jpe?g|png|webp|heic|heif)$/i;
    if ((file.mimetype && allowedMimes.includes(file.mimetype)) || allowedExts.test(file.originalname || '')) {
        return cb(null, true);
    } else {
        cb(new Error(`Only image files are allowed! Uploaded: ${file.originalname}`));
    }
};

// File filter for PDFs
const pdfFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'));
    }
};

// Multer upload configurations
const uploadImage = multer({
    storage: imageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: imageFilter
});

const uploadPDF = multer({
    storage: pdfStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: pdfFilter
});

// Multiple images upload
const uploadImages = multer({
    storage: imageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFilter
});

module.exports = {
    uploadImage,
    uploadPDF,
    uploadImages
};
