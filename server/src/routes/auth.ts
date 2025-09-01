import { Router } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ENV } from '../env';
import { auth } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const r = Router();

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
    role: z.enum(['EMPLOYEE','ADMIN']).optional(),
    companyName: z.string().optional(),
    companyId: z.string().cuid().optional()
});

// Bootstrap first admin
r.post('/bootstrap-admin', async (req, res) => {
    const count = await prisma.user.count();
    if (count > 0) return res.status(400).json({ error: 'Already bootstrapped' });
    const parsed = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(parsed.password, 12);
    const user = await prisma.user.create({ data: { email: parsed.email, passwordHash, name: parsed.name, role: 'ADMIN' } });
    return res.json({ id: user.id });
});


const router = Router();

// Centralize JWT secret with a safe development fallback.
// In production, always set process.env.JWT_SECRET.
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

// Create a signed JWT and set it as an httpOnly cookie
function setSessionCookie(res: any, userId: string) {
    const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // set true behind HTTPS/proxy
        path: "/",
        maxAge: 7 * 24 * 3600 * 1000
    });
}

// Verify cookie and return user id or null
function getUserIdFromReq(req: any): string | null {
    const token = req.cookies?.session;
    if (!token) return null;
    try {
        const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
        return payload.sub;
    } catch {
        return null;
    }
}

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
        if (!email || !password) {
        return res.status(400).json({ error: "Missing email or password" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // Adjust field name if your schema differs (passwordHash / hash / password)
    const hash: string | null =
        (user as any).passwordHash ?? (user as any).hash ?? (user as any).password;

    if (!hash) {
        console.error("User record missing password hash field");
        return res.status(500).json({ error: "User password not configured" });
    }

    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    setSessionCookie(res, user.id);
    return res.json({ ok: true });
    } catch (e) {
        console.error("LOGIN ERROR:", e);
        return res.status(500).json({ error: "Server error during login" });
    }
});

// GET /api/auth/me
router.get("/auth/me", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, companyId: true }
    });

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    return res.json(user);
    } catch (e) {
        console.error("ME ERROR:", e);
        return res.status(500).json({ error: "Server error" });
    }
});

// POST /api/auth/logout
router.post("/auth/logout", (req, res) => {
    res.clearCookie("session", { path: "/" });
    return res.json({ ok: true });
});

export default router;
