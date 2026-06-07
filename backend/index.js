const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');
require('dotenv').config();

// ── Startup env validation ────────────────────────────────────────────────────
const requiredEnv = ['CONVEX_URL', 'CONVEX_ADMIN_KEY', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((k) => !process.env[k]);
if (missingEnv.length) {
  logger.warn(`Missing env vars: ${missingEnv.join(', ')} — some features may fail. ` +
    `Ensure backend/.env exists and the backend was started from the backend/ directory.`);
}

const app = express();

const sanitize = require('./middleware/sanitize');

// ── Security Middleware ────────────────────────────────────────────────────────

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
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// Rate limiting — general API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Rate limiting — strict for auth endpoints in production, lenient in dev
const isDev = process.env.NODE_ENV !== 'production';
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isDev ? 100 : 10,
    skip: isDev ? (req) => ['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(req.ip) : undefined,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);

// Logging — conditional based on environment
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// ── Webhooks (Must be before express.json) ───────────────────────────────────
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./routes/webhook'));

// Body parsing for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// XSS sanitization for all incoming requests
app.use(sanitize);

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// ── Routes ─────────────────────────────────────────────────────────────────────

app.use('/api/auth', require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/adventures', require('./routes/adventures'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/audit', require('./routes/auditLog'));
app.use('/api/settings', require('./routes/settings'));

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
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    logger.info('Available routes:');
    logger.info('  POST   /api/auth/change-password');
    logger.info('  POST   /api/users/:id/avatar');
    logger.info('  PUT    /api/users/:id');
    logger.info('  GET    /api/users/:id');
});
