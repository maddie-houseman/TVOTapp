import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { ENV } from './env.js';

const app = express();

// CORS configuration for cross-origin requests
app.use(
    cors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
        credentials: true,
    })
);

// Handle preflight OPTIONS requests
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

// Parse JSON bodies and cookies
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', 1); // Trust proxy headers for secure cookies

// Request timeout middleware (30 seconds)
app.use((req, res, next) => {
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            res.status(408).json({ error: 'Request timeout' });
        }
    }, 30000);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    next();
});

// Rate limiting to prevent abuse
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // 1000 requests per window
        standardHeaders: true,
        legacyHeaders: false,
    })
);

// Health check endpoint for monitoring
app.get('/api/health', (_req, res) => {
    res.status(200).json({ 
        ok: true, 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Import route handlers
import authRouter from './routes/auth.js';
import l1Router from './routes/l1.js';
import l2Router from './routes/l2.js';
import l3Router from './routes/l3.js';
import l4Router from './routes/l4.js';
import companyRouter from './routes/company.js';

// Mount route handlers
app.use('/api', authRouter);
app.use('/api/l1', l1Router);
app.use('/api/l2', l2Router);
app.use('/api/l3', l3Router);
app.use('/api/l4', l4Router);
app.use('/api', companyRouter);

// Start the server
const port = Number(process.env.PORT) || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log(` Server started successfully on port ${port}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'production'}`);
});

// Initialize database connection in background
setTimeout(async () => {
    try {
        const { prisma } = await import('./prisma.js');
        
        const connectPromise = prisma.$connect();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database connection timeout')), 10000)
        );
        
        await Promise.race([connectPromise, timeoutPromise]);
        await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
        console.error('Prisma connect failed (non-blocking):', e);
    }
}, 1000);

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

