// server/src/routes/auth.ts
import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";

const router = Router();

/* ---------------- Env + helpers ---------------- */

type SameSite = "lax" | "none" | "strict";
type SecureMode = "true" | "false" | "auto";

/** Centralize JWT secret with a safe development fallback.
 * In production, always set process.env.JWT_SECRET.
 */
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

/** true | false | auto (auto = decide from the request/proxy protocol) */
const COOKIE_SECURE_MODE: SecureMode =
  ((process.env.COOKIE_SECURE ?? "auto").toLowerCase() as SecureMode) || "auto";

/** SameSite policy; default to "lax" */
const COOKIE_SAMESITE: SameSite =
  ((process.env.COOKIE_SAMESITE as SameSite) ?? "lax") || "lax";

/** Decide if cookie `secure` should be set */
function resolveSecureFlag(req: Request): boolean {
  if (COOKIE_SECURE_MODE === "true") return true;
  if (COOKIE_SECURE_MODE === "false") return false;

  // auto: use request/proxy protocol
  // requires: app.set('trust proxy', 1) when behind a proxy (Railway/Render/etc.)
  const xfProto = req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  return req.secure || xfProto === "https";
}

/** Create a signed JWT and set it as an httpOnly cookie. */
function setSessionCookie(req: Request, res: Response, userId: string): string {
  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });

  res.cookie("session", token, {
    httpOnly: true,
    secure: resolveSecureFlag(req), // true in cloud if HTTPS; false locally over http
    sameSite: COOKIE_SAMESITE,      // "lax" (default) or "none" if cross-site
    path: "/",
    maxAge: 7 * 24 * 3600 * 1000,   // 7 days
  });

  return token;
}

/* ---------------- Routes ---------------- */

// POST /api/auth/login
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = (req.body ?? {}) as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, (user as any).passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    setSessionCookie(req, res, user.id);
    return res.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("LOGIN ERROR:", e);
    return res.status(500).json({ error: `Server error during login: ${msg}` });
  }
});

// GET /api/auth/me
router.get("/auth/me", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.session as string | undefined;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const me = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, companyId: true },
    });
    if (!me) return res.status(401).json({ error: "Unauthorized" });
    return res.json(me);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

// POST /api/auth/logout
router.post("/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie("session", { path: "/" });
  return res.json({ ok: true });
});

export default router;
