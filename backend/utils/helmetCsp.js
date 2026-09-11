/**
 * Production Helmet CSP allowlist.
 *
 * SPA documents are usually served by Vercel/Vite, not this API. The policy still
 * applies if a browser ever renders a response from the API, and documents extra
 * origins needed for Cloudinary images/PDFs, Google Fonts, Maps, and Instagram.
 *
 * Extra image hosts: CSP_IMG_ORIGINS=https://example.com,https://cdn.example.com
 * Extra connect hosts: CSP_CONNECT_ORIGINS=https://api.example.com
 */
function splitOrigins(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildContentSecurityPolicy() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudinary = [
    'https://res.cloudinary.com',
    'https://*.cloudinary.com',
    ...(cloudName ? [`https://res.cloudinary.com/${cloudName}`] : []),
  ];

  const extraImg = splitOrigins(process.env.CSP_IMG_ORIGINS);
  const extraConnect = splitOrigins(process.env.CSP_CONNECT_ORIGINS);
  const corsOrigins = splitOrigins(process.env.CORS_ORIGINS);
  const frontend = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : [];

  const directives = {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'self'", ...cloudinary],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        ...cloudinary,
        'https://maps.gstatic.com',
        'https://maps.googleapis.com',
        'https://*.google.com',
        'https://*.google.co.in',
        'https://www.instagram.com',
        'https://*.cdninstagram.com',
        'https://*.fbcdn.net',
        'https://images.weserv.nl',
        ...extraImg,
      ],
      mediaSrc: ["'self'", 'blob:', ...cloudinary],
      connectSrc: [
        "'self'",
        ...cloudinary,
        ...corsOrigins,
        ...frontend,
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://maps.googleapis.com',
        'https://www.instagram.com',
        'https://images.weserv.nl',
        ...extraConnect,
      ],
      frameSrc: [
        "'self'",
        'https://maps.google.com',
        'https://www.google.com',
        'https://www.instagram.com',
        'https://instagram.com',
      ],
      workerSrc: ["'self'", 'blob:'],
      childSrc: ["'self'", 'blob:'],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
  };
  if (process.env.NODE_ENV === 'production') {
    directives.upgradeInsecureRequests = [];
  }
  return { useDefaults: false, directives };
}

module.exports = { buildContentSecurityPolicy };
