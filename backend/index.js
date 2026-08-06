const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');
require('dotenv').config();

// ── Startup env validation ────────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production';
const requiredProd = [
  'JWT_SECRET',
  'CONVEX_URL',
  'CONVEX_ADMIN_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CORS_ORIGINS',
  'ADMIN_EMAIL',
];
const requiredDev = ['CONVEX_URL', 'CONVEX_ADMIN_KEY', 'JWT_SECRET'];

if (isProd) {
  const missingProd = requiredProd.filter((k) => !process.env[k]);
  if (missingProd.length) {
    logger.error(`FATAL: Missing required production env vars: ${missingProd.join(', ')}`);
    process.exit(1);
  }
} else {
  const missingDev = requiredDev.filter((k) => !process.env[k]);
  if (missingDev.length) {
    logger.warn(`Missing env vars: ${missingDev.join(', ')} — some features may fail. ` +
      `Ensure backend/.env exists and the backend was started from the backend/ directory.`);
  }
  const optionalServices = [
    ['SMTP_USER', 'email notifications'],
    ['WHATSAPP_TOKEN', 'WhatsApp confirmations'],
    ['WHATSAPP_PHONE_NUMBER_ID', 'WhatsApp confirmations'],
  ];
  for (const [key, feature] of optionalServices) {
    if (!process.env[key]) {
      logger.warn(`Optional: ${key} not set — ${feature} disabled in dev`);
    }
  }
}

const app = express();

const sanitize = require('./middleware/sanitize');

// ── Security Middleware ────────────────────────────────────────────────────────

// Render / reverse-proxy: correct client IPs for rate limiting
app.set('trust proxy', 1);

// Request ID for tracing
app.use(requestId);

// Helmet for security headers
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// Prevent HTTP Parameter Pollution
app.use(hpp());

// CORS — restrict origins in production
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];

app.use(cors({
    origin: (origin, callback) => {
        // In production, reject browser requests with no Origin header
        if (!origin) {
            if (process.env.NODE_ENV === 'production') {
                return callback(new Error('Not allowed by CORS'));
            }
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// Environment check (used by rate limiters below)
const isDev = process.env.NODE_ENV !== 'production';

// Rate limiting — general API (skip health checks and public settings reads)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isDev ? 500 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health'
        || req.path === '/settings/public'
        || req.method === 'GET' && req.path.startsWith('/adventures'),
    message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Rate limiting — strict for auth endpoints in production, lenient in dev
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isDev ? 100 : 10,
    skip: isDev ? (req) => ['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(req.ip) : undefined,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);

// Rate limiting — prevent spam on write endpoints
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isDev ? 100 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please slow down.' },
});
app.use('/api/newsletter/subscribe', writeLimiter);
app.use('/api/newsletter/unsubscribe', writeLimiter);
app.use('/api/contact', writeLimiter); // contact form spam protection
app.use('/api/reviews', writeLimiter);
app.use('/api/wishlist', writeLimiter);
app.use('/api/bookings/manual', writeLimiter);
app.use('/api/payments/manual/submit', writeLimiter);

// Logging — conditional based on environment
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// Body parsing for all other routes
app.use(cookieParser());
const { ensureCsrfCookie, validateCsrf } = require('./middleware/csrf');
app.use(ensureCsrfCookie);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// XSS sanitization for all incoming requests
app.use(sanitize);

// CSRF validation for state-changing API requests
app.use(validateCsrf);

// Maintenance mode gate (admins bypass)
app.use(require('./middleware/maintenanceMode'));

// Local uploads disabled — all media served via Cloudinary (see upload middleware)
if (process.env.NODE_ENV !== 'production') {
    // Dev-only fallback for legacy local files; not exposed in production
    app.use('/uploads', express.static('uploads'));
}

// ── Routes ─────────────────────────────────────────────────────────────────────

app.use('/api/auth', require('./routes/auth'));
app.use('/api/adventures', require('./routes/adventures'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/audit', require('./routes/auditLog'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Phoenix Adventures API' });
});

// Health check — shallow (always 200 if server is up)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Health check — deep (verifies Convex connectivity)
app.get('/api/health', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        try {
            const { getConvexClient } = require('./utils/convexClient');
            getConvexClient();
            return res.status(200).json({ status: 'OK' });
        } catch {
            return res.status(503).json({ status: 'UNAVAILABLE' });
        }
    }

    const startedAt = Date.now();
    let convexOk = false;
    let convexError = null;
    try {
        const { getConvexClient } = require('./utils/convexClient');
        const client = getConvexClient();
        convexOk = typeof client.callFunction === 'function';
    } catch (err) {
        convexError = err.message;
    }
    const ok = convexOk && process.env.JWT_SECRET;
    res.status(ok ? 200 : 503).json({
        status: ok ? 'OK' : 'DEGRADED',
        service: 'phoenix-adventures-api',
        version: process.env.npm_package_version || '1.0.0',
        uptime_seconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        checks: {
            convex: { ok: convexOk, error: convexError },
            jwt: { ok: Boolean(process.env.JWT_SECRET) },
        },
        response_ms: Date.now() - startedAt,
    });
});

// ── Error Handling ─────────────────────────────────────────────────────────────

// 404 handler — unknown routes
app.use((req, res) => {
    logger.warn(`404 ${req.method} ${req.originalUrl}`);
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler — catches unhandled errors
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err.stack || err.message || err);

    // Handle multer file size errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large' });
    }

    // Handle multer file type errors
    if (err.message && err.message.includes('Only')) {
        return res.status(400).json({ success: false, message: err.message });
    }

    // Handle CORS errors
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ success: false, message: 'CORS: Origin not allowed' });
    }

    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Internal server error',
    });
});

// ── Start Server ───────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT);

server.on('listening', () => {
    logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    logger.info('Press Ctrl+C to stop');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(
            `Port ${PORT} is already in use. Another backend is probably still running.\n` +
            '  Stop it with Ctrl+C in that terminal, or run in PowerShell:\n' +
            `  Get-NetTCPConnection -LocalPort ${PORT} | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force`
        );
    } else {
        logger.error('Server failed to start:', err.message);
    }
    process.exit(1);
});
