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
// API key check disabled for testing
app.use((req, res, next) => {
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
app.get('/api/health', (_req, res) => {
    res.status(200).json({ ok: true });
});

// Simple test endpoint that bypasses all middleware
app.get('/test', (_req, res) => {
    res.json({ 
        message: 'Server is working!', 
        timestamp: new Date().toISOString(),
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            API_KEY_SET: !!process.env.API_KEY
        }
    });
});

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

// Comprehensive diagnostic endpoint
app.get('/api/debug/full', async (req, res) => {
    const startTime = Date.now();
    const results: any = {
        timestamp: new Date().toISOString(),
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
            JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT_SET'
        },
        tests: {}
    };

    try {
        // Test 1: Basic server response
        results.tests.basicResponse = { status: 'OK', duration: Date.now() - startTime };

        // Test 2: Database connection
        const dbStart = Date.now();
        try {
            const { prisma } = await import('./prisma.js');
            await prisma.$queryRaw`SELECT 1 as test`;
            results.tests.databaseConnection = { 
                status: 'OK', 
                duration: Date.now() - dbStart 
            };
        } catch (error) {
            results.tests.databaseConnection = { 
                status: 'FAILED', 
                duration: Date.now() - dbStart,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }

        // Test 3: Database tables existence
        const tablesStart = Date.now();
        try {
            const { prisma } = await import('./prisma.js');
            const tables = await prisma.$queryRaw`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE 'L%'
                ORDER BY table_name
            `;
            results.tests.databaseTables = { 
                status: 'OK', 
                duration: Date.now() - tablesStart,
                tables: tables
            };
        } catch (error) {
            results.tests.databaseTables = { 
                status: 'FAILED', 
                duration: Date.now() - tablesStart,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }

        // Test 4: Sample data query
        const dataStart = Date.now();
        try {
            const { prisma } = await import('./prisma.js');
            const [l1Count, l2Count, l3Count] = await Promise.all([
                prisma.l1OperationalInput.count(),
                prisma.l2AllocationWeight.count(),
                prisma.l3BenefitWeight.count()
            ]);
            results.tests.sampleData = { 
                status: 'OK', 
                duration: Date.now() - dataStart,
                counts: { l1: l1Count, l2: l2Count, l3: l3Count }
            };
        } catch (error) {
            results.tests.sampleData = { 
                status: 'FAILED', 
                duration: Date.now() - dataStart,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }

        // Test 5: Memory usage
        const memUsage = process.memoryUsage();
        results.tests.memoryUsage = {
            status: 'OK',
            rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
        };

        results.totalDuration = Date.now() - startTime;
        res.json(results);

    } catch (error) {
        results.error = error instanceof Error ? error.message : 'Unknown error';
        results.totalDuration = Date.now() - startTime;
        res.status(500).json(results);
    }
});

// Test specific company data
app.get('/api/debug/company/:companyId', async (req, res) => {
    const { companyId } = req.params;
    const { period = '2024-01' } = req.query;
    const startTime = Date.now();
    
    try {
        const { prisma } = await import('./prisma.js');
        const normalizedPeriod = new Date(`${period}-01`);
        
        const [l1Data, l2Data, l3Data] = await Promise.all([
            prisma.l1OperationalInput.findMany({
                where: { companyId, period: normalizedPeriod }
            }),
            prisma.l2AllocationWeight.findMany({
                where: { companyId, period: normalizedPeriod }
            }),
            prisma.l3BenefitWeight.findMany({
                where: { companyId, period: normalizedPeriod }
            })
        ]);

        res.json({
            companyId,
            period: normalizedPeriod.toISOString(),
            data: {
                l1: l1Data.map(item => ({
                    department: item.department,
                    budget: Number(item.budget),
                    employees: item.employees
                })),
                l2: l2Data.map(item => ({
                    department: item.department,
                    tower: item.tower,
                    weightPct: Number(item.weightPct)
                })),
                l3: l3Data.map(item => ({
                    category: item.category,
                    weightPct: Number(item.weightPct)
                }))
            },
            counts: {
                l1: l1Data.length,
                l2: l2Data.length,
                l3: l3Data.length
            },
            duration: Date.now() - startTime
        });

    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime
        });
    }
});

/* -------------------- Bootstrap: Routers Only -------------------- */
(async () => {
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

        
        // Start server immediately
        const port = Number(process.env.PORT) || 8080;
        app.listen(port, '0.0.0.0', () => {
            console.log(`API listening on http://0.0.0.0:${port}`);
        });
    } catch (e) {
        console.error('Router load failed:', e);
        process.exit(1);
    }
})();

// Try database connection in background (non-blocking)
setTimeout(async () => {
    try {
        const { prisma } = await import('./prisma.js');
        
        // Add connection timeout
        const connectPromise = prisma.$connect();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database connection timeout')), 10000)
        );
        
        await Promise.race([connectPromise, timeoutPromise]);
        
        // Test the connection with a simple query
        await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
        console.error('Prisma connect failed (non-blocking):', e);
    }
}, 1000);

