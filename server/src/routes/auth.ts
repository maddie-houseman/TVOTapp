// server/src/routes/auth.ts
import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { ENV } from '../env.js';

const router = Router();

/* ---------------- Env + helpers ---------------- */

type SameSite = 'lax' | 'none' | 'strict';

/** Centralize JWT secret with fallback only for dev. */
const JWT_SECRET = ENV.JWT_SECRET || 'dev-secret-change-me';

/** SameSite policy: default to 'none' for cross-site */
const COOKIE_SAMESITE: SameSite = ENV.COOKIE_SAMESITE ?? 'none';

/** Decide if cookie `secure` should be set */
function resolveSecureFlag(req: Request): boolean {
  // Honor explicit ENV override first
    if (ENV.COOKIE_SECURE === true) return true;
    if (ENV.COOKIE_SECURE === false) return false;

    // Fallback: infer via proxy header or req.secure
    const xfProto = req.header('x-forwarded-proto')?.split(',')[0]?.trim();
    return req.secure || xfProto === 'https';
    }

    /** Create a signed JWT and set it as an httpOnly cookie. */
    function setSessionCookie(req: Request, res: Response, userId: string): string {
    const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('session', token, {
        httpOnly: true,
        secure: resolveSecureFlag(req), // true in cloud if HTTPS
        sameSite: COOKIE_SAMESITE,     // 'none' for cross-site (required)
        path: '/',
        maxAge: 7 * 24 * 3600 * 1000,  // 7 days
    });

    return token;
    }

    /* ---------------- Routes ---------------- */

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
