import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";

const router = Router();


function requireApiKey(req: Request, res: Response, next: () => void) {
  const required = process.env.API_KEY;
  if (!required) return res.status(403).json({ error: "API key not configured" });
  const key = req.header("x-api-key");
  if (key !== required) return res.status(401).json({ error: "invalid api key" });
  next();
}

// Seed company data
router.post("/admin/seed", requireApiKey, async (req: Request, res: Response) => {
  try {
    const { companyName, domain, adminEmail, adminPassword, adminName } = (req.body ?? {}) as {
      companyName?: string;
      domain?: string;
      adminEmail?: string;
      adminPassword?: string;
      adminName?: string;
    };

    if (!companyName || !adminEmail || !adminPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create company
    const company = await prisma.company.upsert({
      where: { name: companyName },
      create: { name: companyName, domain: domain ?? null },
      update: {},
    });

    // Create or update admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        passwordHash,
        name: adminName || "Admin",
        role: "ADMIN",
        companyId: company.id,
      },
      update: {
        passwordHash,
        name: adminName || "Admin",
        role: "ADMIN",
        companyId: company.id,
      },
    });

    return res.json({ ok: true, companyId: company.id, userId: user.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("SEED ERROR:", e);
    return res.status(500).json({ error: `Seed failed: ${msg}` });
  }
});

export default router;

























