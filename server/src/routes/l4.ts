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
  console.log(`[L4-CALC] Starting calculation with data: L1=${l1Data.length}, L2=${l2Data.length}, L3=${l3Data.length}`);
  
  // Calculate from actual data if available
  const totalRevenue = l1Data.reduce((sum, item) => sum + Number(item.budget || 0), 0);
  const totalCosts = l1Data.reduce((sum, item) => sum + Number(item.budget || 0), 0);
  
  console.log(`[L4-CALC] Calculated from data - Revenue: ${totalRevenue}, Costs: ${totalCosts}`);
  
  // If no L1 data, use assumptions for a basic calculation
  let revenue, costs;
  if (l1Data.length === 0) {
    console.log(`[L4-CALC] No L1 data, using assumptions`);
    revenue = assumptions.revenueUplift || 0;
    costs = 100000; // Default cost base
  } else {
    revenue = totalRevenue;
    costs = totalCosts;
  }
  
  const netBenefit = revenue - costs;
  const roi = costs > 0 ? ((revenue - costs) / costs) * 100 : 0;
  
  console.log(`[L4-CALC] Final calculation - Revenue: ${revenue}, Costs: ${costs}, ROI: ${roi}%`);
  
  return {
    totalRevenue: revenue,
    totalCosts: costs,
    netBenefit: netBenefit,
    roi: roi,
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
    console.log(`[L4-SNAPSHOT-${requestId}] Fetching data for companyId: ${companyId}, period: ${normalizedPeriod}`);
    
    const l1Data = await prisma.l1OperationalInput.findMany({
            where: { 
              companyId, 
              period: new Date(normalizedPeriod)
            }
          });
    console.log(`[L4-SNAPSHOT-${requestId}] L1 data found: ${l1Data.length} records`);
    
    const l2Data = await prisma.l2AllocationWeight.findMany({
            where: { 
              companyId, 
              period: new Date(normalizedPeriod)
            }
          });
    console.log(`[L4-SNAPSHOT-${requestId}] L2 data found: ${l2Data.length} records`);
    
    const l3Data = await prisma.l3BenefitWeight.findMany({
            where: { 
              companyId, 
              period: new Date(normalizedPeriod)
            }
          });
    console.log(`[L4-SNAPSHOT-${requestId}] L3 data found: ${l3Data.length} records`);

    // Calculate L4 metrics
    const l4Metrics = calculateL4Metrics(l1Data, l2Data, l3Data, assumptions);

    // Save snapshot (handle duplicates by finding existing first)
    console.log(`[L4-SNAPSHOT-${requestId}] Checking for existing snapshot...`);
    const existingSnapshot = await prisma.l4RoiSnapshot.findFirst({
      where: {
        companyId,
        period: new Date(normalizedPeriod)
      }
    });
    
    let snapshot;
    if (existingSnapshot) {
      console.log(`[L4-SNAPSHOT-${requestId}] Updating existing snapshot: ${existingSnapshot.id}`);
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
      console.log(`[L4-SNAPSHOT-${requestId}] Creating new snapshot...`);
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
    console.log(`[L4-SNAPSHOT-${requestId}] Snapshot saved: ${snapshot.id}`);

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

/** ===== Check data for specific company and period ===== */
r.get('/check-company-data/:companyId/:period', async (req: Request, res: Response) => {
  try {
    const { companyId, period } = req.params;
    const normalizedPeriod = toPeriod(period);

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });
    
    if (!company) {
      return res.json({
        success: false,
        error: 'Company not found',
        companyId,
        period: normalizedPeriod
      });
    }
    
    // Check L1, L2, L3 data for this company and period
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
    
    res.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        domain: company.domain
      },
      period: normalizedPeriod,
      dataCounts: {
        l1: l1Data.length,
        l2: l2Data.length,
        l3: l3Data.length
      },
      data: {
        l1: l1Data,
        l2: l2Data,
        l3: l3Data
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/** ===== Get correct company ID ===== */
r.get('/get-company-id', async (req: Request, res: Response) => {
  try {
    // Get the first company that has data
    const company = await prisma.company.findFirst({
      where: {
        l1Inputs: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        domain: true
      }
    });
    
    if (!company) {
      // If no company with data, get any company
      const anyCompany = await prisma.company.findFirst({
        select: {
          id: true,
          name: true,
          domain: true
        }
      });
      
      if (!anyCompany) {
        return res.status(404).json({
          success: false,
          error: 'No companies found in database'
        });
      }
      
      return res.json({
        success: true,
        company: anyCompany,
        message: 'Using any available company (no data found)'
      });
    }
    
    res.json({
      success: true,
      company,
      message: 'Found company with data'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/** ===== Quick diagnostic test ===== */
r.get('/test-quick', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const results: any = {};
  
  try {
    // Test 1: Basic connection
    const connStart = Date.now();
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as test`;
    results.connection = { duration: Date.now() - connStart, success: true };

    // Test 2: Company query
    const companyStart = Date.now();
    const company = await prisma.company.findFirst();
    results.companyQuery = { 
      duration: Date.now() - companyStart, 
      success: true, 
      found: !!company,
      companyId: company?.id 
    };

    // Test 3: L1 query (this might be the slow one)
    const l1Start = Date.now();
    const l1Count = await prisma.l1OperationalInput.count();
    results.l1Query = { 
      duration: Date.now() - l1Start, 
      success: true, 
      count: l1Count 
    };

    // Test 4: L2 query
    const l2Start = Date.now();
    const l2Count = await prisma.l2AllocationWeight.count();
    results.l2Query = { 
      duration: Date.now() - l2Start, 
      success: true, 
      count: l2Count 
    };

    // Test 5: L3 query
    const l3Start = Date.now();
    const l3Count = await prisma.l3BenefitWeight.count();
    results.l3Query = { 
      duration: Date.now() - l3Start, 
      success: true, 
      count: l3Count 
    };

    // Test 6: Snapshot query
    const snapshotStart = Date.now();
    const snapshotCount = await prisma.l4RoiSnapshot.count();
    results.snapshotQuery = { 
      duration: Date.now() - snapshotStart, 
      success: true, 
      count: snapshotCount 
    };

    const totalDuration = Date.now() - startTime;
    
    res.json({
      success: true,
      totalDuration,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      totalDuration,
      results,
      timestamp: new Date().toISOString()
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

/** ===== Minimal test endpoint ===== */
r.post('/snapshot-minimal', async (req: Request, res: Response) => {
  const requestId = randomUUID();
  const startTime = Date.now();
  
  try {
    console.log(`[MINIMAL-${requestId}] Starting minimal test`);
    
    const { companyId, period, assumptions } = req.body;
    console.log(`[MINIMAL-${requestId}] Received: companyId=${companyId}, period=${period}`);
    
    // Test 1: Basic connection
    console.log(`[MINIMAL-${requestId}] Testing database connection...`);
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log(`[MINIMAL-${requestId}] Database connection OK`);
    
    // Test 2: Company check
    console.log(`[MINIMAL-${requestId}] Checking company...`);
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    console.log(`[MINIMAL-${requestId}] Company found: ${!!company}`);
    
    // Test 3: Simple snapshot creation
    console.log(`[MINIMAL-${requestId}] Creating snapshot...`);
    const snapshot = await prisma.l4RoiSnapshot.create({
      data: {
        companyId,
        period: new Date(period),
        assumptions: JSON.stringify(assumptions),
        totalCost: 100000,
        totalBenefit: 150000,
        roiPct: 50.0
      }
    });
    console.log(`[MINIMAL-${requestId}] Snapshot created: ${snapshot.id}`);
    
    const duration = Date.now() - startTime;
    console.log(`[MINIMAL-${requestId}] Completed in ${duration}ms`);
    
    res.json({
      success: true,
      snapshotId: snapshot.id,
      duration,
      requestId
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[MINIMAL-${requestId}] Error after ${duration}ms:`, error);
    
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      duration,
      requestId
    });
  }
});

/** ===== Routes ===== */
r.post('/snapshot', auth, postSnapshot);
r.get('/snapshots/:companyId', auth, getSnapshots);

export default r;
