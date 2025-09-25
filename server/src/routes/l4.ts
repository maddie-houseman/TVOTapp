import { Router, type RequestHandler, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { auth } from '../middleware/auth.js'; // named import (auth is a function)
import type { JwtPayload } from 'jsonwebtoken';

const r = Router();

/** What auth middleware puts on req.user (per your project: it has userId, not id) */
type AuthUser = JwtPayload & {
  userId: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'USER' | string;
  companyId?: string;
};

/** ===== Zod schema & helpers ===== */
const snapshotSchema = z.object({
  companyId: z.string().min(1),
  // YYYY-MM or YYYY-MM-DD
  period: z
    .string()
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "Use 'YYYY-MM' or 'YYYY-MM-DD'"),
  assumptions: z
    .object({
      revenueUplift: z.number().nonnegative().default(0),
      productivityGainHours: z.number().nonnegative().default(0),
      avgLoadedRate: z.number().nonnegative().default(0),
    })
    .passthrough(), // allow extra keys
});
type SnapshotBody = z.infer<typeof snapshotSchema>;

function toPeriod(bodyPeriod: string) {
  // normalize to first day of month if day not provided
  if (/^\d{4}-\d{2}$/.test(bodyPeriod)) return `${bodyPeriod}-01`;
  return bodyPeriod;
}

/** ===== POST /api/l4/snapshot =====
 * Computes cost/benefit and upserts a snapshot for (companyId, period)
 */
const postSnapshot: RequestHandler<unknown, any, SnapshotBody> = async (
  req,
  res: Response
) => {
  const parsed = snapshotSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const body = parsed.data;

  // RBAC: employees may only act on their own company
  const u = req.user as AuthUser | undefined;
  if (u?.role !== 'ADMIN' && u?.companyId !== body.companyId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const period = toPeriod(body.period);
  const userId = u?.userId ?? undefined;

  // --- Inputs you already store ---
  const l1 = await prisma.l1OperationalInput.findMany({
    where: { companyId: body.companyId, period },
  });
  type L1Row = (typeof l1)[number];

  // kept for future distribution logic (prefixed to avoid noUnusedLocals)
  const _l2 = await prisma.l2AllocationWeight.findMany({
    where: { companyId: body.companyId, period },
  });
  const _l3 = await prisma.l3BenefitWeight.findMany({
    where: { companyId: body.companyId, period },
  });

  // --- Minimal, transparent math ---
  const totalCost = l1.reduce(
    (acc: number, row: L1Row) => acc + Number(row.budget ?? 0),
    0
  );

  // Benefit = Revenue uplift + productivity value
  const productivityValue =
    (body.assumptions.productivityGainHours ?? 0) *
    (body.assumptions.avgLoadedRate ?? 0);
  const totalBenefit =
    (body.assumptions.revenueUplift ?? 0) + productivityValue;

  // Derived fields (not persisted as top-level in Prisma model)
  const net = totalBenefit - totalCost;
  const roiPct = totalCost > 0 ? (net / totalCost) * 100 : 0;

  // Upsert snapshot (only known fields)
  const snap = await prisma.l4RoiSnapshot.upsert({
    where: {
      companyId_period: { companyId: body.companyId, period },
    },
    create: {
      companyId: body.companyId,
      period,
      totalCost,
      totalBenefit,
      roiPct, // <-- added so it matches Prisma model
      assumptions: { ...body.assumptions, _derived: { net, roiPct } } as any,
      createdById: userId,
    },
    update: {
      totalCost,
      totalBenefit,
      roiPct, // <-- added for updates too
      assumptions: { ...body.assumptions, _derived: { net, roiPct } } as any,
      updatedById: userId,
    },
  });

  res.json(snap);
};

r.post('/snapshot', auth, postSnapshot);

/** ===== GET /api/l4/snapshots/:companyId ===== */
type SnapParams = { companyId: string };

const getSnapshots: RequestHandler<SnapParams> = async (req, res: Response) => {
  const { companyId } = req.params;

  const u = req.user as AuthUser | undefined;
  if (u?.role !== 'ADMIN' && u?.companyId !== companyId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const snaps = await prisma.l4RoiSnapshot.findMany({
    where: { companyId },
    orderBy: { period: 'asc' },
  });

  res.json(snaps);
};

r.get('/snapshots/:companyId', auth, getSnapshots);

export default r;
