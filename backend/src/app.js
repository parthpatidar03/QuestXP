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
const errorMiddleware = require('./middleware/errorMiddleware');
const { logger } = require('./utils/logger');

const app = express();

// 1. Trusted Proxy (Railway/Heroku)
app.set('trust proxy', 1);

// 2. Origin Configuration
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''));
console.log('[Debug] CORS Allowed Origins:', allowedOrigins);

// 3. Global CORS
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        
        const isAllowed = allowedOrigins.some(allowed => origin === allowed) || 
                         origin.endsWith('.vercel.app') ||
                         origin.endsWith('.questxp.in') ||
                         origin === 'https://questxp.in' ||
                         (['localhost', '127.0.0.1'].some(h => origin.includes(h)) && process.env.NODE_ENV !== 'production');
        
        if (isAllowed) return cb(null, true);
        cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

// Handle Preflight for all routes
app.options('*', cors());

app.use(helmet());
app.use(hpp());

// 4. Security Headers & Rate Limiting
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
});

app.use(express.json());
app.use(cookieParser());
app.use(compression());

// Request logger
app.use(requestLogger);

// 5. Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/public', require('./routes/public'));

// Global limiter applies to all other routes
app.use(limiter);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/internal', require('./routes/internal'));
app.use('/api/lectures', require('./routes/lectures'));
app.use('/api/doubts', doubtRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Central robust error handler
app.use(errorMiddleware);

module.exports = app;

