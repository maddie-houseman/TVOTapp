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

/* -------------------- Bootstrap: Prisma + Routers -------------------- */
(async () => {
    try {
        const { prisma } = await import('./prisma.js');
        await prisma.$connect();
        console.log('Prisma connected');
    } catch (e) {
        console.error('Prisma connect failed:', e);
    }

    try {
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
        
        // Start server after routes are mounted
        const port = Number(process.env.PORT) || 8080;
        app.listen(port, '0.0.0.0', () => {
            console.log(`API listening on http://0.0.0.0:${port}`);
        });
    } catch (e) {
        console.error('Router load failed:', e);
        process.exit(1);
    }
})();
