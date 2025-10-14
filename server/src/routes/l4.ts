import { Router, type RequestHandler, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { auth } from '../middleware/auth.js';
import type { JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'crypto';

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

/** Calculate L4 metrics from L1, L2, L3 data */
function calculateL4Metrics(l1Data: any[], l2Data: any[], l3Data: any[], assumptions: any) {
  // Simple calculation - handle empty data gracefully
  const totalRevenue = l1Data.reduce((sum, item) => sum + (item.budget || 0), 0);
  const totalCosts = l1Data.reduce((sum, item) => sum + (item.budget || 0), 0);
  
  // If no data, use assumptions
  const revenue = totalRevenue > 0 ? totalRevenue : assumptions.revenueUplift || 0;
  const costs = totalCosts > 0 ? totalCosts : 100000; // Default cost
  
  return {
    totalRevenue: revenue,
    totalCosts: costs,
    netBenefit: revenue - costs,
    roi: costs > 0 ? ((revenue - costs) / costs) * 100 : 0,
    assumptions,
    dataCount: { l1: l1Data.length, l2: l2Data.length, l3: l3Data.length }
  };
}

/** ===== POST /api/l4/snapshot ===== */
const postSnapshot: RequestHandler<unknown, any, SnapshotBody> = async (req, res) => {
  const requestId = randomUUID();
  const startTime = Date.now();
  
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
    
    // Test database connection
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as test`;

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

    // Fetch data with simple queries
    const l1Data = await prisma.l1OperationalInput.findMany({
      where: { 
        companyId, 
        period: new Date(normalizedPeriod)
      }
    });
    
    const l2Data = await prisma.l2AllocationWeight.findMany({
      where: { 
        companyId, 
        period: new Date(normalizedPeriod)
      }
    });
    
    const l3Data = await prisma.l3BenefitWeight.findMany({
      where: { 
        companyId, 
        period: new Date(normalizedPeriod)
      }
    });

    // Calculate L4 metrics
    const l4Metrics = calculateL4Metrics(l1Data, l2Data, l3Data, assumptions);

    // Save snapshot
    const snapshot = await prisma.l4RoiSnapshot.create({
      data: {
        companyId,
        period: new Date(normalizedPeriod),
        assumptions: JSON.stringify(assumptions),
        totalCost: l4Metrics.totalCosts,
        totalBenefit: l4Metrics.totalRevenue,
        roiPct: l4Metrics.roi
      }
    });

    const totalDuration = Date.now() - startTime;

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
      duration: totalDuration,
      requestId,
      dataCount: l4Metrics.dataCount
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[L4-SNAPSHOT-${requestId}] Error:`, error);
    
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      requestId,
      duration: totalDuration,
      timestamp: new Date().toISOString()
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

/** ===== Test endpoint ===== */
r.get('/test', async (req: Request, res: Response) => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as test`;
    
    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/** ===== Step-by-step database test ===== */
r.get('/test-steps', async (req: Request, res: Response) => {
  const requestId = randomUUID();
  const startTime = Date.now();
  const steps: any[] = [];
  
  try {
    // Step 1: Basic connection
    const step1Start = Date.now();
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as test`;
    steps.push({
      step: 1,
      name: 'Basic connection',
      duration: Date.now() - step1Start,
      success: true
    });

    // Step 2: Check if company exists
    const step2Start = Date.now();
    const companyId = 'test-company';
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId }
    });
    steps.push({
      step: 2,
      name: 'Check company exists',
      duration: Date.now() - step2Start,
      success: true,
      found: !!existingCompany
    });

    // Step 3: Create company if needed
    const step3Start = Date.now();
    let company = existingCompany;
    if (!company) {
      company = await prisma.company.create({
        data: {
          id: companyId,
          name: companyId,
          domain: `${companyId}.com`
        }
      });
    }
    steps.push({
      step: 3,
      name: 'Create/use company',
      duration: Date.now() - step3Start,
      success: true,
      created: !existingCompany
    });

    // Step 4: Test L1 query
    const step4Start = Date.now();
    const l1Data = await prisma.l1OperationalInput.findMany({
      where: { 
        companyId, 
        period: new Date('2024-01-01')
      }
    });
    steps.push({
      step: 4,
      name: 'L1 data query',
      duration: Date.now() - step4Start,
      success: true,
      count: l1Data.length
    });

    // Step 5: Test L2 query
    const step5Start = Date.now();
    const l2Data = await prisma.l2AllocationWeight.findMany({
      where: { 
        companyId, 
        period: new Date('2024-01-01')
      }
    });
    steps.push({
      step: 5,
      name: 'L2 data query',
      duration: Date.now() - step5Start,
      success: true,
      count: l2Data.length
    });

    // Step 6: Test L3 query
    const step6Start = Date.now();
    const l3Data = await prisma.l3BenefitWeight.findMany({
      where: { 
        companyId, 
        period: new Date('2024-01-01')
      }
    });
    steps.push({
      step: 6,
      name: 'L3 data query',
      duration: Date.now() - step6Start,
      success: true,
      count: l3Data.length
    });

    // Step 7: Test snapshot creation
    const step7Start = Date.now();
    const snapshot = await prisma.l4RoiSnapshot.create({
      data: {
        companyId,
        period: new Date('2024-01-01'),
        assumptions: JSON.stringify({ test: true }),
        totalCost: 100000,
        totalBenefit: 150000,
        roiPct: 50.0
      }
    });
    steps.push({
      step: 7,
      name: 'Create snapshot',
      duration: Date.now() - step7Start,
      success: true,
      snapshotId: snapshot.id
    });

    const totalDuration = Date.now() - startTime;
    
    res.json({
      success: true,
      requestId,
      totalDuration,
      steps,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[TEST-STEPS-${requestId}] Error at step ${steps.length + 1}:`, error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      requestId,
      totalDuration,
      steps,
      failedAtStep: steps.length + 1,
      timestamp: new Date().toISOString()
    });
  }
});

/** ===== Test endpoint without auth ===== */
r.post('/snapshot-test', postSnapshot);

/** ===== Routes ===== */
r.post('/snapshot', auth, postSnapshot);
r.get('/snapshots/:companyId', auth, getSnapshots);

export default r;
