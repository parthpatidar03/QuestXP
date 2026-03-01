const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const progressRoutes = require('./routes/progress');
const planRoutes = require('./routes/plan');
const gamificationRoutes = require('./routes/gamification');

const app = express();

app.use(express.json());
app.use(cookieParser());
// T064 — CORS: allow comma-separated origins from env (e.g. "http://localhost:5173,https://questxp.com")
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',').map(o => o.trim());

app.use(cors({
    origin: (origin, cb) => {
        // Allow non-browser (e.g. Postman) or listed origins
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
}));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/gamification', gamificationRoutes);

// T063 — 404 handler for unknown routes
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Central error handler — hide stack traces in production
app.use((err, req, res, next) => {
    console.error('[Error]', err.message, process.env.NODE_ENV !== 'production' ? err.stack : '');
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Internal Server Error')
    });
});

module.exports = app;
