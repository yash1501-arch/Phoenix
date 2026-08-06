const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DEFAULT_TRANSFORMATION = [
  { width: 1920, height: 1080, crop: 'limit', quality: 'auto' },
];

const SCREENSHOT_TTL_SECONDS = 60 * 60;

/**
 * Upload an image buffer to Cloudinary (SDK v2).
 */
function uploadImageBuffer(buffer, mimetype, options = {}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || cloudName.includes('your_') || cloudName === 'opencode') {
    return Promise.reject(
      new Error(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env'
      )
    );
  }

  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return Promise.reject(new Error('Invalid image buffer — upload failed'));
  }

  const dataUri = `data:${mimetype || 'image/jpeg'};base64,${buffer.toString('base64')}`;

  return cloudinary.uploader.upload(dataUri, {
    folder: options.folder || 'phoenix_adventures',
    resource_type: 'image',
    type: options.private ? 'authenticated' : 'upload',
    transformation: options.transformation || DEFAULT_TRANSFORMATION,
  });
}

/**
 * Short-lived signed URL for private (authenticated) payment screenshots.
 */
function getSignedScreenshotUrl(publicId, ttlSeconds = SCREENSHOT_TTL_SECONDS) {
  if (!publicId || !process.env.CLOUDINARY_API_SECRET) {
    return null;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;

  return cloudinary.url(publicId, {
    resource_type: 'image',
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
  });
}

/**
 * Upload a raw file buffer (PDF, etc.) to Cloudinary.
 */
function uploadRawBuffer(buffer, mimetype, options = {}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || cloudName.includes('your_') || cloudName === 'opencode') {
    return Promise.reject(
      new Error(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env'
      )
    );
  }

  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return Promise.reject(new Error('Invalid file buffer — upload failed'));
  }

  const dataUri = `data:${mimetype || 'application/pdf'};base64,${buffer.toString('base64')}`;

  return cloudinary.uploader.upload(dataUri, {
    folder: options.folder || 'phoenix_confirmations',
    resource_type: 'raw',
    type: 'upload',
  });
}

module.exports = {
  cloudinary,
  uploadImageBuffer,
  uploadRawBuffer,
  getSignedScreenshotUrl,
  SCREENSHOT_TTL_SECONDS,
};
