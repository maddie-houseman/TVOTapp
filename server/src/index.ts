import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { ENV } from './env.js';

const app = express();

/* -------------------- CORS (first) -------------------- */
app.use(
    cors({
        // reflect the request Origin header
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
        credentials: true, // allow cookies
    })
);

// 🔒 Hard preflight handler to avoid proxy timeouts (502 on OPTIONS)
app.use((req, res, next) => {
    if (req.method !== 'OPTIONS') return next();

    const origin = (req.headers.origin as string | undefined) ?? '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    return res.sendStatus(204);
});

/* -------------------- Parsers / proxy -------------------- */
app.use(express.json());
app.use(cookieParser());
// Behind Railway proxy so req.secure works correctly
app.set('trust proxy', 1);

/* -------------------- API key guard -------------------- */
/**
 * Keep your x-api-key requirement for non-auth endpoints, but:
 *  - never gate preflights
 *  - allow /api/auth/* without an API key
 */
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    if (req.path.startsWith('/api/auth/')) return next();

    const requiredKey = process.env.API_KEY;
    // Skip API key requirement if not set or if it's a framework-related endpoint
    if (!requiredKey || req.path.startsWith('/api/l1') || req.path.startsWith('/api/l2') || req.path.startsWith('/api/l3') || req.path.startsWith('/api/l4')) return next();

    const key = req.header('x-api-key');
    if (key !== requiredKey) return res.status(401).json({ error: 'invalid api key' });

    return next();
});

/* -------------------- Request timeout -------------------- */
app.use((req, res, next) => {
    // Set a 30-second timeout for all requests
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            res.status(408).json({ error: 'Request timeout' });
        }
    }, 30000); // 30 seconds

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    next();
});

/* -------------------- Rate limit -------------------- */
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 1000,
        standardHeaders: true,
        legacyHeaders: false,
    })
);

/* -------------------- Health -------------------- */
app.get('/api/health', (_req, res) => res.status(200).json({ ok: true }));

// Database health check endpoint
app.get('/api/health/db', async (_req, res) => {
    try {
        const { prisma } = await import('./prisma.js');
        
        // Test database connection with timeout
        const queryPromise = prisma.$queryRaw`SELECT 1 as test`;
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database query timeout')), 5000)
        );
        
        await Promise.race([queryPromise, timeoutPromise]);
        res.status(200).json({ ok: true, database: 'connected' });
    } catch (error) {
        console.error('Database health check failed:', error);
        res.status(503).json({ 
            ok: false, 
            database: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/* -------------------- Bootstrap: Routers Only -------------------- */
(async () => {
    try {
        console.log('Loading routes...');
        const { default: authRouter } = await import('./routes/auth.js');
        const { default: l1Router } = await import('./routes/l1.js');
        const { default: l2Router } = await import('./routes/l2.js');
        const { default: l3Router } = await import('./routes/l3.js');
        const { default: l4Router } = await import('./routes/l4.js');
        const { default: companyRouter } = await import('./routes/company.js');
        const { default: aiRouter } = await import('./routes/ai.js');

        // auth routes are public; others may use your own auth middleware where needed
        app.use('/api', authRouter);
        app.use('/api/l1', l1Router);
        app.use('/api/l2', l2Router);
        app.use('/api/l3', l3Router);
        app.use('/api/l4', l4Router);
        app.use('/api', companyRouter);
        app.use('/api', aiRouter);

        console.log('Routers mounted');
        
        // Start server immediately
        const port = Number(process.env.PORT) || 8080;
        app.listen(port, '0.0.0.0', () => {
            console.log(`API listening on http://0.0.0.0:${port}`);
            console.log('Server started successfully - database connection will be attempted in background');
        });
    } catch (e) {
        console.error('Router load failed:', e);
        process.exit(1);
    }
})();

// Try database connection in background (non-blocking)
setTimeout(async () => {
    try {
        console.log('Attempting database connection...');
        const { prisma } = await import('./prisma.js');
        
        // Add connection timeout
        const connectPromise = prisma.$connect();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database connection timeout')), 10000)
        );
        
        await Promise.race([connectPromise, timeoutPromise]);
        console.log('Prisma connected successfully');
        
        // Test the connection with a simple query
        await prisma.$queryRaw`SELECT 1`;
        console.log('Database connection verified');
    } catch (e) {
        console.error('Prisma connect failed (non-blocking):', e);
        console.log('Server continues to run with mock data fallbacks');
    }
}, 1000);

// Add Railway-specific logging
console.log('🚀 Server started on Railway');
console.log('📡 L4 endpoint available at: POST /api/l4/snapshot');
console.log('⚡ L4 endpoint now responds instantly (no database hanging)');
