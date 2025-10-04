// server/src/routes/auth.ts
import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { ENV } from '../env.js';

const router = Router();

/* ---------------- Env + helpers ---------------- */

type SameSite = 'lax' | 'none' | 'strict';
const JWT_SECRET = ENV.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_SAMESITE: SameSite = ENV.COOKIE_SAMESITE ?? 'none';

function resolveSecureFlag(req: Request): boolean {
  // Explicit ENV wins
    if (ENV.COOKIE_SECURE === true) return true;
    if (ENV.COOKIE_SECURE === false) return false;

    // Infer via proxy header / req.secure
    const xfProto = req.header('x-forwarded-proto')?.split(',')[0]?.trim();
    return req.secure || xfProto === 'https';
    }

    function setSessionCookie(req: Request, res: Response, userId: string): string {
    const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('session', token, {
        httpOnly: true,
        secure: resolveSecureFlag(req), // true behind HTTPS
        sameSite: COOKIE_SAMESITE,      // 'none' for cross-site
        path: '/',
        maxAge: 7 * 24 * 3600 * 1000,
    });

    return token;
    }

    /* ---------------- Routes ---------------- */

    // POST /api/auth/signup
    router.post('/auth/signup', async (req: Request, res: Response) => {
    try {
        const { email, password, name, companyName, companyDomain } = (req.body ?? {}) as { 
        email?: string; 
        password?: string; 
        name?: string;
        companyName?: string;
        companyDomain?: string;
    };
        
        if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields: email, password, name' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create company if provided
        let companyId: string | null = null;
        if (companyName) {
        const company = await prisma.company.create({
            data: {
            name: companyName,
            domain: companyDomain || null,
            },
        });
        companyId = company.id;
        }

        // Create user
        const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            name,
            role: 'ADMIN', // First user in a company is admin
            companyId,
        },
        });

        setSessionCookie(req, res, user.id);
        return res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId } });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('SIGNUP ERROR:', e);
        return res.status(500).json({ error: `Server error during signup: ${msg}` });
    }
    });

    // POST /api/auth/login
    router.post('/auth/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
        if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, (user as any).passwordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        setSessionCookie(req, res, user.id);
        return res.json({ ok: true });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('LOGIN ERROR:', e);
        return res.status(500).json({ error: `Server error during login: ${msg}` });
    }
    });

    // GET /api/auth/me
    router.get('/auth/me', async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.session as string | undefined;
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
        const me = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true, role: true, companyId: true },
        });

        if (!me) return res.status(401).json({ error: 'Unauthorized' });
        return res.json(me);
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    });

    // POST /api/auth/logout
    router.post('/auth/logout', (_req: Request, res: Response) => {
    res.clearCookie('session', { path: '/' });
    return res.json({ ok: true });
    });

export default router;
