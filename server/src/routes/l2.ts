// server/src/routes/l2.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { auth } from "../middleware/auth";

const r = Router();

/** ---- schema & helpers ---- */
const l2Schema = z.object({
    companyId: z.string().min(1),
  // accepts YYYY-MM or YYYY-MM-01
    period: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, "Use YYYY-MM or YYYY-MM-01"),
    department: z.enum([
        "ENGINEERING",
        "SALES",
        "FINANCE",
        "HR",
        "MARKETING",
        "OPERATIONS",
    ] as const),
    tower: z.enum(["APP_DEV", "CLOUD", "END_USER"] as const),
    weightPct: z.number().min(0).max(1),
});

function toPeriodDate(p: string) {
    const iso = /^\d{4}-\d{2}$/.test(p) ? `${p}-01` : p;
    return new Date(iso + "T00:00:00.000Z");
}

/** ---- GET: list weights for a company/period ---- */
r.get("/:companyId/:period", auth(), async (req, res) => {
    const { companyId, period } = req.params;

  // RBAC: employees may only read their own company
    if (req.user?.role !== "ADMIN" && req.user?.companyId !== companyId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const rows = await prisma.l2AllocationWeight.findMany({
        where: { companyId, period: toPeriodDate(period) },
        orderBy: [{ department: "asc" }, { tower: "asc" }],
    });

    res.json(rows);
});

/** ---- POST: upsert a single weight row ---- */
r.post("/", auth(), async (req, res) => {
    const parsed = l2Schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const body = parsed.data;

  // RBAC: employees may only write to their own company
    if (req.user?.role !== "ADMIN" && req.user?.companyId !== body.companyId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const period = toPeriodDate(body.period);
  // support either req.user.id or req.user.userId
    const userId =
        (req.user as any)?.id ??
        (req.user as any)?.userId ??
        undefined;

  // Upsert this tower's weight (number is OK for decimal fields)
    const created = await prisma.l2AllocationWeight.upsert({
        where: {
            companyId_period_department_tower: {
                companyId: body.companyId,
                period,
                department: body.department,
                tower: body.tower,
            },
    },
    create: {
        companyId: body.companyId,
        period,
        department: body.department,
        tower: body.tower,
        weightPct: body.weightPct,
        createdById: userId,
    },
    update: {
        weightPct: body.weightPct,
        updatedById: userId,
    },
    });

  // Validate the department's weights sum to ~1.0 (±0.0001 tolerance)
    const rows = await prisma.l2AllocationWeight.findMany({
        where: {
            companyId: body.companyId,
            period,
            department: body.department,
        },
    });

    type L2Row = Awaited<ReturnType<typeof prisma.l2AllocationWeight.findMany>>[number];

    const sum = rows.reduce((acc: number, row: L2Row) => acc + Number(row.weightPct), 0);

    if (sum < 0.9999 || sum > 1.0001) {
        return res.status(400).json({ error: "Weights for department must sum to 1.0" });
    }

    res.json(created);
});

export default r;
