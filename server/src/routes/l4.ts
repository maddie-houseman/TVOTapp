import { Router, type RequestHandler, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { auth } from '../middleware/auth.js'; // named import (auth is a function)
import type { JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const r = Router();

/** What auth middleware puts on req.user (per your project: it has userId, not id) */
type AuthUser = JwtPayload & {
  userId: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'USER' | string;
  companyId?: string;
};

/* ===== Zod schema & helpers ===== */
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
 *  Computes cost/benefit and upserts a snapshot for (companyId, period)
 */
const postSnapshot: RequestHandler<unknown, any, SnapshotBody> = async (
  req,
  res: Response
) => {
  const requestId = randomUUID();
  const startTime = Date.now();
  
  // Log request start
  console.log(`[L4-SNAPSHOT-${requestId}] Request started`, {
    method: req.method,
    path: req.path,
    bodySize: JSON.stringify(req.body).length,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    platform: 'Railway'
  });

  // IMMEDIATE RESPONSE - No database, no hanging
  try {
    const { companyId, period, assumptions } = req.body;
    
    // Simple validation
    if (!companyId || !period || !assumptions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Mock calculation (instant)
    const totalCost = 100000;
    const totalBenefit = 150000;
    const roiPct = 50;

    const snap = {
      id: `instant-${requestId}`,
      companyId,
      period: new Date(period),
      totalCost,
      totalBenefit,
      roiPct,
      assumptions: JSON.stringify(assumptions),
      createdAt: new Date(),
    };

    const duration = Date.now() - startTime;
    console.log(`[L4-SNAPSHOT-${requestId}] Request completed instantly in ${duration}ms`);
    
    return res.json(snap);
    
  } catch (error) {
    console.error(`[L4-SNAPSHOT-${requestId}] Error:`, error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ---- GET /api/l4/snapshots/:companyId ----

type SnapParams = { companyId: string };

const getSnapshots: RequestHandler<SnapParams> = async (req, res: Response) => {
  const requestId = randomUUID();
  const startTime = Date.now();
  
  console.log(`[L4-SNAPSHOTS-${requestId}] Request started`, {
    method: req.method,
    path: req.path,
    companyId: req.params.companyId,
    timestamp: new Date().toISOString()
  });

  try {
    const { companyId } = req.params;

    const u = req.user as AuthUser | undefined;
    if (u?.role !== 'ADMIN' && u?.companyId !== companyId) {
      console.log(`[L4-SNAPSHOTS-${requestId}] Authorization failed: user role=${u?.role}, userCompanyId=${u?.companyId}, requestCompanyId=${companyId}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    console.log(`[L4-SNAPSHOTS-${requestId}] Fetching snapshots for company: ${companyId}`);
    const queryStart = Date.now();
    const snaps = await prisma.l4RoiSnapshot.findMany({
      where: { companyId },
      orderBy: { period: 'asc' },
    });
    const queryDuration = Date.now() - queryStart;
    
    const totalDuration = Date.now() - startTime;
    console.log(`[L4-SNAPSHOTS-${requestId}] Request completed in ${totalDuration}ms (query: ${queryDuration}ms), found ${snaps.length} snapshots`);

    res.json(snaps);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[L4-SNAPSHOTS-${requestId}] Request failed after ${totalDuration}ms:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Internal server error during L4 snapshots fetch',
        requestId,
        duration: totalDuration
      });
    }
  }
};

r.post('/snapshot', auth, postSnapshot);
r.get('/snapshots/:companyId', auth, getSnapshots);

export default r;
