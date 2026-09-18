const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');
const { validateCookieConfig } = require('./utils/authCookie');
const { initRedis, getRedis, isRedisReady } = require('./utils/redis');

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

async function boot() {
await initRedis();
validateCookieConfig();

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
  const { isCloudinaryConfigured } = require('./utils/cloudinaryClient');
  if (!isCloudinaryConfigured()) {
    logger.warn('Cloudinary credentials missing — image uploads will fail until CLOUDINARY_* is set in backend/.env');
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

// Helmet for security headers (production CSP allowlists Cloudinary, fonts, Maps, Instagram)
const { buildContentSecurityPolicy } = require('./utils/helmetCsp');
app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: process.env.NODE_ENV === 'production'
        ? buildContentSecurityPolicy()
        : false,
}));

// Prevent HTTP Parameter Pollution
app.use(hpp());

// CORS — restrict origins in production
const { parseCorsOrigins, isOriginAllowed } = require('./utils/corsOrigins');
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? parseCorsOrigins(process.env.CORS_ORIGINS)
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];
const allowVercelPreviews = String(process.env.CORS_ALLOW_VERCEL_PREVIEWS || '').toLowerCase() === 'true';

app.use(cors({
    origin: (origin, callback) => {
        // No Origin = non-browser (health checks, curl, Render/Koyeb probes).
        // Browser calls must match CORS_ORIGINS (and optional Vercel preview hosts).
        if (isOriginAllowed(origin, allowedOrigins, { allowVercelPreviews })) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    exposedHeaders: ['X-CSRF-Token'],
}));

// Environment check (used by rate limiters below)
const isDev = process.env.NODE_ENV !== 'production';

function buildRateLimitStore(prefix) {
    if (!isRedisReady()) return undefined;
    const redis = getRedis();
    if (!redis) return undefined;
    try {
        const { RedisStore } = require('rate-limit-redis');
        return new RedisStore({
            sendCommand: (...args) => redis.call(...args),
            prefix: `rl:${prefix}:`,
        });
    } catch (err) {
        logger.warn('Redis rate-limit store unavailable:', err.message);
        return undefined;
    }
}

// Rate limiting — general API (skip health checks and public settings reads)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isDev ? 500 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    store: buildRateLimitStore('api'),
    skip: (req) => req.path === '/health'
        || req.path === '/settings/public'
        || req.path === '/sitemap.xml'
        || req.path === '/api/sitemap.xml'
        || req.method === 'GET' && req.path.startsWith('/adventures'),
    message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Rate limiting — strict for auth endpoints in production, lenient in dev
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isDev ? 100 : 10,
    skip: (req) => {
        if (isDev && ['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(req.ip)) return true;
        // Session probe is not a credential-guessing attack; exclude from login rate limit.
        if (req.method === 'GET' && req.originalUrl.split('?')[0] === '/api/auth/me') return true;
        return false;
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: buildRateLimitStore('auth'),
    message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);

const emergencyResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: isDev ? 20 : 3,
    standardHeaders: true,
    legacyHeaders: false,
    store: buildRateLimitStore('2fa-emergency'),
    message: { success: false, message: 'Too many emergency reset attempts. Try again later.' },
});
app.use('/api/auth/2fa/emergency-reset', emergencyResetLimiter);

// Rate limiting — prevent spam on write endpoints
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isDev ? 100 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: buildRateLimitStore('write'),
    message: { success: false, message: 'Too many requests, please slow down.' },
});
app.use('/api/newsletter/subscribe', writeLimiter);
app.use('/api/newsletter/unsubscribe', writeLimiter);
app.use('/api/contact', writeLimiter); // contact form spam protection
app.use('/api/reviews', writeLimiter);
app.use('/api/wishlist', writeLimiter);
app.use('/api/waitlist', writeLimiter);
app.use('/api/bookings/manual', writeLimiter);
app.use('/api/payments/manual/submit', writeLimiter);

const analyticsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isDev ? 500 : 120,
    standardHeaders: true,
    legacyHeaders: false,
    store: buildRateLimitStore('analytics'),
    message: { success: false, message: 'Too many requests, please slow down.' },
});
app.use('/api/analytics/visit', analyticsLimiter);

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
app.use('/api/share', require('./routes/share'));
app.use('/api/adventures', require('./routes/adventures'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/waitlist', require('./routes/waitlist'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/audit', require('./routes/auditLog'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api', require('./routes/sitemap'));

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Phoenix Adventures API' });
});

// Health check — shallow (always 200 if server is up; used by load balancers)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Health check — deep (verifies Convex + optional Redis)
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

    let redisOk = null;
    let redisMode = 'memory';
    let redisError = null;
    if (process.env.REDIS_URL) {
        redisMode = isRedisReady() ? 'redis' : 'fallback';
        redisOk = isRedisReady();
        if (!redisOk) redisError = 'not connected';
    }

    if (process.env.NODE_ENV === 'production') {
        const redisRequired = process.env.REQUIRE_REDIS === 'true';
        const healthy = convexOk && (!redisRequired || redisOk);
        return res.status(healthy ? 200 : 503).json({
            status: healthy ? 'OK' : 'UNAVAILABLE',
        });
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
            redis: { mode: redisMode, ok: redisOk, error: redisError },
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

    const inlineWorker = process.env.ENABLE_INLINE_WORKER !== 'false';
    if (inlineWorker && isRedisReady()) {
        try {
            const { startWorker } = require('./utils/jobQueue');
            startWorker();
        } catch (err) {
            logger.warn('Inline job worker not started:', err.message);
        }
    } else if (process.env.REDIS_URL && !isRedisReady()) {
        logger.info('Jobs will run inline until Redis is available (docker compose up -d redis)');
    } else if (!process.env.REDIS_URL) {
        logger.info('Jobs will run inline (no REDIS_URL).');
    }
    try {
        const { startScheduledJobs } = require('./jobs/scheduler');
        startScheduledJobs();
    } catch (err) {
        logger.warn('Scheduled jobs not started:', err.message);
    }
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
} // end boot()

boot().catch((err) => {
  logger.error('Failed to boot server:', err.message || err);
  process.exit(1);
});
