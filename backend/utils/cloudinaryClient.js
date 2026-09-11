const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { v2: cloudinary } = require('cloudinary');

const DEFAULT_TRANSFORMATION = [
  { width: 1920, height: 1080, crop: 'limit', quality: 'auto' },
];

const SCREENSHOT_TTL_SECONDS = 60 * 60;

function envCredentials() {
  const cloud_name = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const api_key = String(process.env.CLOUDINARY_API_KEY || '').trim();
  const api_secret = String(process.env.CLOUDINARY_API_SECRET || '').trim();
  return { cloud_name, api_key, api_secret };
}

function isPlaceholder(value) {
  const v = String(value || '').toLowerCase();
  return !v || v.includes('your_cloudinary') || v === 'opencode';
}

function isCloudinaryConfigured() {
  const { cloud_name, api_key, api_secret } = envCredentials();
  return !isPlaceholder(cloud_name) && !isPlaceholder(api_key) && !isPlaceholder(api_secret);
}

function applyConfig() {
  const creds = envCredentials();
  cloudinary.config({
    cloud_name: creds.cloud_name,
    api_key: creds.api_key,
    api_secret: creds.api_secret,
    secure: true,
  });
  return creds;
}

function assertConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env'
    );
  }
  applyConfig();
}

/**
 * Upload an image buffer to Cloudinary (SDK v2).
 * Public adventure/tour images: folder phoenix_adventures, type upload.
 * Payment screenshots: folder phoenix_payments, type authenticated (signed delivery).
 */
function uploadImageBuffer(buffer, mimetype, options = {}) {
  try {
    assertConfigured();
  } catch (err) {
    return Promise.reject(err);
  }

  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return Promise.reject(new Error('Invalid image buffer — upload failed'));
  }

  const dataUri = `data:${mimetype || 'image/jpeg'};base64,${buffer.toString('base64')}`;
  const isPrivate = Boolean(options.private);
  const folder = options.folder || (isPrivate ? 'phoenix_payments' : 'phoenix_adventures');

  const uploadOptions = {
    folder,
    resource_type: 'image',
    type: isPrivate ? 'authenticated' : 'upload',
    unique_filename: true,
    overwrite: false,
  };

  // Do not apply public transformations to authenticated payment screenshots.
  if (!isPrivate) {
    uploadOptions.transformation = options.transformation || DEFAULT_TRANSFORMATION;
  }

  return cloudinary.uploader.upload(dataUri, uploadOptions);
}

/**
 * Short-lived signed URL for private (authenticated) payment screenshots.
 */
function getSignedScreenshotUrl(publicId, ttlSeconds = SCREENSHOT_TTL_SECONDS) {
  if (!publicId || !isCloudinaryConfigured()) {
    return null;
  }

  applyConfig();
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
  try {
    assertConfigured();
  } catch (err) {
    return Promise.reject(err);
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
  isCloudinaryConfigured,
  applyConfig,
  SCREENSHOT_TTL_SECONDS,
};
