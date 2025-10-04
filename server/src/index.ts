import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { ENV } from './env.js';

const app = express();

/* -------------------- CORS FIRST -------------------- */
app.use(cors({
  // echo request origin (safe for credentials as long as it's not '*')
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true, // <-- allow cookies
    }));

    // Let preflight pass through quickly
    app.options('*', cors({
    origin: true,
    credentials: true,
    }));

    /* -------------------- Parsers -------------------- */
    app.use(express.json());
    app.use(cookieParser());

    // When behind a proxy (Railway), this helps the cookie 'secure' detection in routes/auth.ts
    app.set('trust proxy', 1);

    /* -------------------- API key guard -------------------- */
    // Keep your existing x-api-key middleware, but do NOT block OPTIONS.
    app.use((req, res, next) => {
    if (req.method === 'OPTIONS') return next(); // never auth preflights

    const required = process.env.API_KEY;
    if (!required) return next(); // no key set => allow (dev)

    const key = req.header('x-api-key');
    if (key !== required) return res.status(401).json({ error: 'invalid api key' });
    next();
    });

    /* -------------------- Rate limit -------------------- */
    app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    }));

    /* -------------------- Boot + Routes -------------------- */
    const port = Number(process.env.PORT) || 8080;
    app.listen(port, '0.0.0.0', () => {
    console.log(`API listening on http://0.0.0.0:${port}`);
    });

    (async () => {
    try {
        // Prisma
        const { prisma } = await import('./prisma.js');
        await prisma.$connect();
        console.log('Prisma connected');
    } catch (e) {
        console.error('Prisma connect failed:', e);
    }

    try {
        // Routers (keep your existing structure)
        const { default: authRouter } = await import('./routes/auth.js');
        const { default: l1Router } = await import('./routes/l1.js');
        const { default: l2Router } = await import('./routes/l2.js');
        const { default: l3Router } = await import('./routes/l3.js');
        const { default: l4Router } = await import('./routes/l4.js');
        const { default: companyRouter } = await import('./routes/company.js');
        const { default: aiRouter } = await import('./routes/ai.js');

        // Mount routes (auth remains public)
        app.use('/api', authRouter);
        app.use('/api', l1Router);
        app.use('/api', l2Router);
        app.use('/api', l3Router);
        app.use('/api', l4Router);
        app.use('/api', companyRouter);
        app.use('/api', aiRouter);

        console.log('Routers mounted');
    } catch (e) {
        console.error('Router load failed:', e);
    }
})();
