const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const helmet = require('helmet');
const hpp = require('hpp');

require('dotenv').config();

const { globalLimiter } = require('./middleware/rateLimiter');
const limiter = globalLimiter;


const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const progressRoutes = require('./routes/progress');
const planRoutes = require('./routes/plan');
const doubtRoutes = require('./routes/doubtRoutes');
const gamificationRoutes = require('./routes/gamification');
const feedbackRoutes = require('./routes/feedback');
const dashboardRoutes = require('./routes/hub');
const roadmapRoutes = require('./routes/roadmap');
const requestLogger = require('./middleware/requestLogger');
const requestId = require('./middleware/requestId');
const errorMiddleware = require('./middleware/errorMiddleware');
const { logger } = require('./utils/logger');

const app = express();

// 1. Trusted Proxy (Azure App Service / Railway / Heroku / Cloudflare)
//    Honour up to 2 hops by default — Cloudflare → Azure FrontDoor → app.
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 2));

// 2. Origin Configuration
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

// Allow opt-in for preview-style domains. By default we DO NOT allow *.vercel.app
// in production — any random Vercel deployment could otherwise call our API.
const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === 'true';
console.log('[Debug] CORS Allowed Origins:', allowedOrigins, { allowVercelPreviews });

// 3. Global CORS
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true); // server-to-server / curl / native apps

        const isAllowed =
            allowedOrigins.includes(origin) ||
            origin === 'https://questxp.in' ||
            origin.endsWith('.questxp.in') ||
            (allowVercelPreviews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) ||
            (process.env.NODE_ENV !== 'production'
                && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin));

        if (isAllowed) return cb(null, true);
        return cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

// Handle Preflight for all routes
app.options('*', cors());

// ─── Helmet hardening ───────────────────────────────────────────────────────
// Defaults give us: HSTS, X-Content-Type-Options, frameguard, Referrer-Policy,
// Origin-Agent-Cluster, X-DNS-Prefetch-Control, X-Download-Options,
// X-Permitted-Cross-Domain-Policies, and X-XSS-Protection (disabled).
//
// CSP is OFF by default because a too-strict policy can silently break Google
// OAuth / Vercel Analytics / YouTube embeds. Opt in with CSP_ENABLED=true once
// you've tested all third-party origins your deployment uses.
const cspEnabled = process.env.CSP_ENABLED === 'true';
app.use(helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: cspEnabled ? {
        useDefaults: true,
        directives: {
            'default-src': ["'self'"],
            'script-src':  ["'self'", "'unsafe-inline'",
                            'https://accounts.google.com',
                            'https://apis.google.com',
                            'https://va.vercel-scripts.com'],
            'style-src':   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            'font-src':    ["'self'", 'https://fonts.gstatic.com', 'data:'],
            'connect-src': ["'self'",
                            'https://accounts.google.com',
                            'https://www.googleapis.com',
                            'https://*.firebaseio.com',
                            'https://identitytoolkit.googleapis.com',
                            'https://*.questxp.in',
                            'wss:'],
            'frame-src':   ["'self'",
                            'https://accounts.google.com',
                            'https://www.youtube.com',
                            'https://www.youtube-nocookie.com'],
            'img-src':     ["'self'", 'data:', 'https:', 'blob:'],
            'media-src':   ["'self'", 'https:'],
            'object-src':  ["'none'"],
            'base-uri':    ["'self'"],
            'form-action': ["'self'"],
        },
    } : false,
}));
app.use(hpp());

// 4. Body parsing & cookies (with a sane request size cap)
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(compression());

// Defense against NoSQL injection and prototype pollution. MUST run AFTER
// express.json so we can inspect / sanitize req.body.
const { mongoSanitize, blockPrototypeKeys } = require('./middleware/security');
app.use(mongoSanitize);
app.use(blockPrototypeKeys);

// Request correlation + structured logging
app.use(requestId);
app.use(requestLogger);

// 5. Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Guard DB-dependent routes — returns 503 within 1ms if Mongo isn't connected.
// Mounted AFTER /api/health and /api/logs/* so monitoring + log ingestion stay
// alive during a DB outage.
const dbReady = require('./middleware/dbReady');

// Auth routes (geo-block is inside the auth router on a per-route basis)
app.use('/api/auth', dbReady, authRoutes);
app.use('/api/public', require('./routes/public'));

// Feedback mounted BEFORE the global Redis limiter so it remains
// fully operational even if Redis is down.
app.use('/api/feedback', feedbackRoutes);

// Client log ingestion mounted BEFORE the global limiter for the same reason —
// we want frontend error reports even if Redis is unreachable.
app.use('/api/logs', require('./routes/clientLogs'));

// Global limiter applies to all other routes
app.use(limiter);

// All routes below this line touch MongoDB — guard them so a DB outage
// returns 503 in <1ms instead of leaking 12s axios timeouts to the UI.
app.use('/api/dashboard',    dbReady, dashboardRoutes);
app.use('/api/gamification', dbReady, gamificationRoutes);
app.use('/api/courses',      dbReady, courseRoutes);
app.use('/api/progress',     dbReady, progressRoutes);
app.use('/api/plan',         dbReady, planRoutes);
app.use('/api/internal',     dbReady, require('./routes/internal'));
app.use('/api/lectures',     dbReady, require('./routes/lectures'));
app.use('/api/doubts',       dbReady, doubtRoutes);
app.use('/api/roadmap',      dbReady, roadmapRoutes);
app.use('/api/notifications', dbReady, require('./routes/notificationRoutes'));
app.use('/api/friendzones',  dbReady, require('./routes/friendZones'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Central robust error handler
app.use(errorMiddleware);

module.exports = app;
