// server/src/routes/l3.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { auth } from "../middleware/auth";

const r = Router();

/** ===== Schema & helpers ===== */
const l3Schema = z.object({
    companyId: z.string().min(1),
    // Accepts YYYY-MM or YYYY-MM-01
    period: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, "Use YYYY-MM or YYYY-MM-01"),
    category: z.enum(["PRODUCTIVITY", "REVENUE_UPLIFT"] as const),
    weightPct: z.number().min(0).max(1),
});

function toPeriodDate(p: string) {
    const iso = /^\d{4}-\d{2}$/.test(p) ? `${p}-01` : p;
    return new Date(iso + "T00:00:00.000Z");
}

/** ===== GET: list L3 weights for company/period ===== */
r.get("/:companyId/:period", auth(), async (req, res) => {
    const { companyId, period } = req.params;

  // RBAC: employees can only read their own company
    if (req.user?.role !== "ADMIN" && req.user?.companyId !== companyId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const rows = await prisma.l3BenefitWeight.findMany({
        where: { companyId, period: toPeriodDate(period) },
        orderBy: { category: "asc" },
    });

    res.json(rows);
});

/** ===== POST: upsert a single L3 weight row ===== */
r.post("/", auth(), async (req, res) => {
    const parsed = l3Schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    } 
    const body = parsed.data;

  // RBAC: employees can only write to their own company
    if (req.user?.role !== "ADMIN" && req.user?.companyId !== body.companyId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const period = toPeriodDate(body.period);
  // tolerate either id or userId on req.user
    const userId = (req.user as any)?.id ?? (req.user as any)?.userId ?? undefined;

  // Upsert (Prisma accepts number for Decimal columns)
    const created = await prisma.l3BenefitWeight.upsert({
        where: {
            companyId_period_category: {
                companyId: body.companyId,
                period,
                category: body.category,
            },
    },
        create: {
            companyId: body.companyId,
            period,
            category: body.category,
            weightPct: body.weightPct,
            createdById: userId,
        },
        update: {
            weightPct: body.weightPct,
            updatedById: userId,
    },
    });

  // Validate total weights across categories ~= 1.0
    const rows = await prisma.l3BenefitWeight.findMany({
        where: { companyId: body.companyId, period },
    });
    type L3Row = typeof rows[number]; // derive element type
    const sum = rows.reduce((acc: number, row: L3Row) => acc + Number(row.weightPct), 0);

    if (sum < 0.9999 || sum > 1.0001) {
        return res.status(400).json({ error: "L3 weights must sum to 1.0" });
    }

    res.json(created);
});

export default r;
