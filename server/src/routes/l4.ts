// server/src/routes/l4.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { auth } from "../middleware/auth";

const r = Router();

/** ===== Schema & helpers ===== */
const snapshotSchema = z.object({
    companyId: z.string().min(1),
  // Accept YYYY-MM or YYYY-MM-01
    period: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, "Use YYYY-MM or YYYY-MM-01"),
    assumptions: z.object({
        revenueUplift: z.number().nonnegative().default(0),
        productivityGainHours: z.number().nonnegative().default(0),
        avgLoadedRate: z.number().nonnegative().default(0),
    }),
    });

function toPeriodDate(p: string) {
    const iso = /^\d{4}-\d{2}$/.test(p) ? `${p}-01` : p;
    return new Date(iso + "T00:00:00.000Z");
}

/** ===== POST /api/l4/snapshot =====
 * Computes cost/benefit/ROI and upserts a snapshot for (companyId, period)
 */
r.post("/snapshot", auth(), async (req, res) => {
  // ✅ parse and **define body**
    const body = snapshotSchema.parse(req.body);

  // RBAC: employees can only act on their own company
    if (req.user?.role !== "ADMIN" && req.user?.companyId !== body.companyId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const period = toPeriodDate(body.period);
    const userId = (req.user as any)?.id ?? (req.user as any)?.userId ?? undefined;

  // Fetch inputs for this period (typed, no implicit any)
    const l1 = await prisma.l1OperationalInput.findMany({
        where: { companyId: body.companyId, period },
    });
    type L1Row = typeof l1[number];

    const l2 = await prisma.l2AllocationWeight.findMany({
        where: { companyId: body.companyId, period },
    });

    const l3 = await prisma.l3BenefitWeight.findMany({
        where: { companyId: body.companyId, period },
    });

  // --- Minimal, transparent math ---
  // Cost: sum of L1 budgets (you can refine with L2 if desired)
    const totalCost = l1.reduce((acc: number, row: L1Row) => acc + Number(row.budget), 0);

  // Benefit: Revenue uplift + productivity value
    const productivityValue =
        body.assumptions.productivityGainHours * body.assumptions.avgLoadedRate;

  // (Optional) you could apply L3 weights here if you want distribution.
    const totalBenefit = body.assumptions.revenueUplift + productivityValue;

    const net = totalBenefit - totalCost;
    const roiPct = totalCost > 0 ? net / totalCost : 0;

  // Upsert snapshot
    const snap = await prisma.l4RoiSnapshot.upsert({
        where: {
            companyId_period: { companyId: body.companyId, period },
        },
    create: {
        companyId: body.companyId,
        period,
        totalCost,
        totalBenefit,
        net,
        roiPct,
        assumptions: body.assumptions as any,
        createdById: userId,
    },
    update: {
        totalCost,
        totalBenefit,
        net,
        roiPct,
        assumptions: body.assumptions as any,
        updatedById: userId,
        },
    });

    res.json(snap);
});

/** ===== GET /api/l4/snapshots/:companyId ===== */
r.get("/snapshots/:companyId", auth(), async (req, res) => {
    const { companyId } = req.params;

    if (req.user?.role !== "ADMIN" && req.user?.companyId !== companyId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const snaps = await prisma.l4RoiSnapshot.findMany({
        where: { companyId },
        orderBy: { period: "asc" },
    });

    res.json(snaps);
    });

    export default r;
