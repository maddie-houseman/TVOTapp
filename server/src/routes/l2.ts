
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";

const r = Router();


const l2Schema = z.object({
    companyId: z.string().min(1),

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

// save all three towers for one department at once
const l2BatchSchema = z.object({
    companyId: z.string().min(1),
    period: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Use YYYY-MM or YYYY-MM-01'),
    department: z.enum([
        'ENGINEERING',
        'SALES',
        'FINANCE',
        'HR',
        'MARKETING',
        'OPERATIONS',
    ] as const),
    weights: z.object({
        APP_DEV: z.number().min(0).max(1),
        CLOUD: z.number().min(0).max(1),
        END_USER: z.number().min(0).max(1),
    }),
});

function toPeriodDate(p: string) {
    const iso = /^\d{4}-\d{2}$/.test(p) ? `${p}-01` : p;
    return new Date(iso + "T00:00:00.000Z");
}


r.get("/:companyId/:period", async (req, res) => {
    const { companyId, period } = req.params;

    const rows = await prisma.l2AllocationWeight.findMany({
        where: { companyId, period: toPeriodDate(period) },
        orderBy: [{ department: "asc" }, { tower: "asc" }],
    });

    res.json(rows);
});


r.post("/", auth(), async (req, res) => {
    const parsed = l2Schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const body = parsed.data;

 // employees may only write to their own company
    if (req.user?.role !== "ADMIN" && req.user?.companyId !== body.companyId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const period = toPeriodDate(body.period);
  // support either req.user.id or req.user.userId
    const userId =
        (req.user as any)?.id ??
        (req.user as any)?.userId ??
        undefined;

// tower's weight (number is OK for decimal fields)
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
    },
    });

    console.log(`[L2 DEBUG] Upserted tower ${body.tower} with weight ${body.weightPct}`);


// Validate the department's weights sum to ~1.0 (±0.0001 tolerance)
    const rows = await prisma.l2AllocationWeight.findMany({
        where: {
            companyId: body.companyId,
            period,
            department: body.department,
        },
    });

    type L2Row = Awaited<ReturnType<typeof prisma.l2AllocationWeight.findMany>>[number];

// Only validate sum if we have all three towers
    if (rows.length >= 3) {
        const sum = rows.reduce((acc: number, row: L2Row) => acc + Number(row.weightPct), 0);

        if (sum < 0.9999 || sum > 1.0001) {
            return res.status(400).json({ 
                error: `Weights for department must sum to 1.0 (current sum: ${sum.toFixed(3)})` 
            });
        }
    }

    res.json(created);
});


export default r;


r.post('/batch', auth(), async (req, res) => {
    const parsed = l2BatchSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const body = parsed.data;

    // employees may only write to their own company
    if (req.user?.role !== 'ADMIN' && req.user?.companyId !== body.companyId) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const period = toPeriodDate(body.period);
    const userId = (req.user as any)?.id ?? (req.user as any)?.userId ?? undefined;


    const sum = Number(body.weights.APP_DEV) + Number(body.weights.CLOUD) + Number(body.weights.END_USER);
    if (Math.abs(sum - 1) >= 0.0001) {
        return res.status(400).json({ error: `Weights must sum to 1.0 (current sum: ${sum.toFixed(3)})` });
    }

    // Upsert all three at once
    const result = await prisma.$transaction(async (tx) => {
        const upsert = async (tower: 'APP_DEV' | 'CLOUD' | 'END_USER', weightPct: number) =>
            tx.l2AllocationWeight.upsert({
                where: {
                    companyId_period_department_tower: {
                        companyId: body.companyId,
                        period,
                        department: body.department,
                        tower,
                    },
                },
                create: {
                    companyId: body.companyId,
                    period,
                    department: body.department,
                    tower,
                    weightPct,
                    createdById: userId,
                },
                update: { weightPct },
            });

        const [a, c, e] = await Promise.all([
            upsert('APP_DEV', body.weights.APP_DEV),
            upsert('CLOUD', body.weights.CLOUD),
            upsert('END_USER', body.weights.END_USER),
        ]);
        return [a, c, e];
    });

    return res.json({ ok: true, rows: result });
});
