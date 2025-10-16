import { Router, type RequestHandler, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { auth } from '../middleware/auth.js';
import type { JwtPayload } from 'jsonwebtoken';

const r = Router();

/** What auth middleware puts on req.user */
type AuthUser = JwtPayload & {
  userId: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'USER' | string;
  companyId?: string;
};

/* ===== Zod schema ===== */
const snapshotSchema = z.object({
  companyId: z.string().min(1),
  period: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "Use 'YYYY-MM' or 'YYYY-MM-DD'"),
  assumptions: z.object({
      revenueUplift: z.number().nonnegative().default(0),
      productivityGainHours: z.number().nonnegative().default(0),
      avgLoadedRate: z.number().nonnegative().default(0),
  }).passthrough(),
});
type SnapshotBody = z.infer<typeof snapshotSchema>;

function toPeriod(bodyPeriod: string) {
  if (/^\d{4}-\d{2}$/.test(bodyPeriod)) return `${bodyPeriod}-01`;
  return bodyPeriod;
}

/** Calculate L4 metrics */
function calculateL4Metrics(l1Data: any[], l2Data: any[], l3Data: any[], assumptions: any) {
  console.log(`[L4-CALC] Starting calculation with data: L1=${l1Data.length}, L2=${l2Data.length}, L3=${l3Data.length}`);
  
  // Calculate total costs from L1 data
  const totalCosts = l1Data.reduce((sum, item) => sum + Number(item.budget || 0), 0);
  
  // Calculate benefits from assumptions
  const productivityBenefit = (assumptions.productivityGainHours || 0) * (assumptions.avgLoadedRate || 0);
  const revenueBenefit = assumptions.revenueUplift || 0;
  const totalBenefits = productivityBenefit + revenueBenefit;
  
  // Basic calculations
  const netBenefit = totalBenefits - totalCosts;
  const roi = totalCosts > 0 ? ((totalBenefits - totalCosts) / totalCosts) * 100 : 0;
  
  console.log(`[L4-CALC] Calculation - Benefits: ${totalBenefits}, Costs: ${totalCosts}, ROI: ${roi}%`);
  
  return {
    totalRevenue: totalBenefits,
    totalCosts: totalCosts,
    netBenefit: netBenefit,
    roi: roi,
    assumptions,
    dataCount: { l1: l1Data.length, l2: l2Data.length, l3: l3Data.length }
  };
}

/** ===== POST /api/l4/snapshot ===== */
const postSnapshot: RequestHandler<unknown, any, SnapshotBody> = async (req, res) => {
  try {
    const { companyId, period, assumptions } = req.body;
    
    // Validate input
    if (!companyId || !period || !assumptions) {
      return res.status(400).json({
        error: 'Missing required fields: companyId, period, assumptions'
      });
    }

    // Normalize period
    const normalizedPeriod = toPeriod(period);
    
    // Ensure company exists (create if it doesn't)
    let company = await prisma.company.findUnique({
      where: { id: companyId }
    });
    
    if (!company) {
      company = await prisma.company.create({
        data: {
          id: companyId,
          name: companyId,
          domain: `${companyId}.com`
        }
      });
    }

    // Fetch L1, L2, L3 data
    const [l1Data, l2Data, l3Data] = await Promise.all([
      prisma.l1OperationalInput.findMany({
        where: { 
          companyId, 
          period: new Date(normalizedPeriod)
        }
      }),
      prisma.l2AllocationWeight.findMany({
        where: { 
          companyId, 
          period: new Date(normalizedPeriod)
        }
      }),
      prisma.l3BenefitWeight.findMany({
        where: { 
          companyId, 
          period: new Date(normalizedPeriod)
        }
      })
    ]);

    // Calculate L4 metrics
    const l4Metrics = calculateL4Metrics(l1Data, l2Data, l3Data, assumptions);

    // Save snapshot (handle duplicates by finding existing first)
    const existingSnapshot = await prisma.l4RoiSnapshot.findFirst({
      where: {
        companyId,
        period: new Date(normalizedPeriod)
      }
    });
    
    let snapshot;
    if (existingSnapshot) {
      snapshot = await prisma.l4RoiSnapshot.update({
        where: { id: existingSnapshot.id },
        data: {
          assumptions: JSON.stringify(assumptions),
          totalCost: l4Metrics.totalCosts,
          totalBenefit: l4Metrics.totalRevenue,
          roiPct: l4Metrics.roi
        }
      });
    } else {
      snapshot = await prisma.l4RoiSnapshot.create({
        data: {
          companyId,
          period: new Date(normalizedPeriod),
          assumptions: JSON.stringify(assumptions),
          totalCost: l4Metrics.totalCosts,
          totalBenefit: l4Metrics.totalRevenue,
          roiPct: l4Metrics.roi
        }
      });
    }

    res.json({
      success: true,
      snapshot: {
        id: snapshot.id,
        companyId: snapshot.companyId,
        period: snapshot.period,
        assumptions: snapshot.assumptions ? JSON.parse(snapshot.assumptions) : null,
        totalCost: snapshot.totalCost,
        totalBenefit: snapshot.totalBenefit,
        roiPct: snapshot.roiPct,
        createdAt: snapshot.createdAt
      },
      dataCount: l4Metrics.dataCount
    });

  } catch (error) {
    console.error('Error in postSnapshot:', error);
    
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

/** ===== GET /api/l4/snapshots/:companyId ===== */
const getSnapshots: RequestHandler<{ companyId: string }> = async (req, res) => {
  try {
    const { companyId } = req.params;

    const snapshots = await prisma.l4RoiSnapshot.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      snapshots: snapshots.map((s: any) => ({
        id: s.id,
        companyId: s.companyId,
        period: s.period,
        assumptions: s.assumptions ? JSON.parse(s.assumptions) : null,
        totalCost: s.totalCost,
        totalBenefit: s.totalBenefit,
        roiPct: s.roiPct,
        createdAt: s.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching snapshots:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

/** ===== Routes ===== */
r.post('/snapshot', auth, postSnapshot);
r.get('/snapshots/:companyId', getSnapshots);

export default r;