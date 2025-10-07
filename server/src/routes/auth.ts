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

    function setSessionCookie(req: Request, res: Response, userId: string, role: string, companyId: string | null): string {
    const token = jwt.sign({ sub: userId, role, companyId }, JWT_SECRET, { expiresIn: '7d' });

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

    // /api/auth/signup
    router.post('/auth/signup', async (req: Request, res: Response) => {
    try {
        const { email, password, name, companyName, companyDomain, role } = (req.body ?? {}) as { 
        email?: string; 
        password?: string; 
        name?: string;
        companyName?: string;
        companyDomain?: string;
        role?: 'ADMIN' | 'EMPLOYEE';
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

        // Determine user role: if creating a company, user is admin; otherwise, use provided role or default to EMPLOYEE
        const userRole = companyName ? 'ADMIN' : (role || 'EMPLOYEE');

        // Create user
        const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            name,
            role: userRole,
            companyId,
        },
        });

        setSessionCookie(req, res, user.id, user.role, user.companyId);
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

        setSessionCookie(req, res, user.id, user.role, user.companyId);
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

    // GET /api/auth/company
    router.get('/auth/company', async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.session as string | undefined;
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
        const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { companyId: true, role: true },
        });

        if (!user || !user.companyId) return res.status(404).json({ error: 'No company found' });

        const company = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { id: true, name: true, domain: true },
        });

        if (!company) return res.status(404).json({ error: 'Company not found' });
        return res.json(company);
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    });

    // GET /api/auth/companies (admin only)
    router.get('/auth/companies', async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.session as string | undefined;
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
        const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { role: true },
        });

        if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

        const companies = await prisma.company.findMany({
        select: { id: true, name: true, domain: true },
        orderBy: { name: 'asc' }
        });

        return res.json(companies);
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    });

    // POST /api/auth/logout
    router.post('/auth/logout', (_req: Request, res: Response) => {
    res.clearCookie('session', { path: '/' });
    return res.json({ ok: true });
    });

    // PUT /api/auth/profile
    router.put('/auth/profile', async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.session as string | undefined;
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
        const { name, email } = (req.body ?? {}) as { name?: string; email?: string };
        
        if (!name && !email) {
        return res.status(400).json({ error: 'No fields to update' });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) {
        // Check if email is already taken by another user
        const existingUser = await prisma.user.findFirst({
            where: { email, id: { not: payload.sub } }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        updateData.email = email;
        }

        const updatedUser = await prisma.user.update({
        where: { id: payload.sub },
        data: updateData,
        select: { id: true, email: true, name: true, role: true, companyId: true }
        });

        return res.json(updatedUser);
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('PROFILE UPDATE ERROR:', e);
        return res.status(500).json({ error: `Server error during profile update: ${msg}` });
    }
    });

    // PUT /api/auth/password
    router.put('/auth/password', async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.session as string | undefined;
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
        const { currentPassword, newPassword } = (req.body ?? {}) as { 
        currentPassword?: string; 
        newPassword?: string; 
    };
        
        if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Get current user with password hash
        const user = await prisma.user.findUnique({ 
        where: { id: payload.sub },
        select: { passwordHash: true }
        });
        
        if (!user) return res.status(401).json({ error: 'User not found' });

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
        where: { id: payload.sub },
        data: { passwordHash: newPasswordHash }
        });

        return res.json({ ok: true });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('PASSWORD CHANGE ERROR:', e);
        return res.status(500).json({ error: `Server error during password change: ${msg}` });
    }
    });

export default router;
