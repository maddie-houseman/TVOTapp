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

/** Calculate comprehensive L4 ROI metrics for technology investment decisions */
function calculateL4Metrics(l1Data: any[], l2Data: any[], l3Data: any[], assumptions: any) {
  console.log(`[L4-CALC] Starting comprehensive ROI analysis with data: L1=${l1Data.length}, L2=${l2Data.length}, L3=${l3Data.length}`);
  
  // === COST ANALYSIS ===
  const totalCosts = l1Data.reduce((sum, item) => sum + Number(item.budget || 0), 0);
  const totalEmployees = l1Data.reduce((sum, item) => sum + Number(item.employees || 0), 0);
  
  // Cost per employee (key efficiency metric)
  const costPerEmployee = totalEmployees > 0 ? totalCosts / totalEmployees : 0;
  
  // Department cost breakdown for allocation analysis
  const departmentCosts = l1Data.reduce((acc, item) => {
    acc[item.department] = (acc[item.department] || 0) + Number(item.budget);
    return acc;
  }, {});
  
  // === BENEFIT ANALYSIS ===
  // Productivity benefits (time savings × loaded rate)
  const productivityBenefit = (assumptions.productivityGainHours || 0) * (assumptions.avgLoadedRate || 0);
  
  // Revenue uplift benefits
  const revenueBenefit = assumptions.revenueUplift || 0;
  
  // Risk avoidance benefits (estimated as 10% of total costs for IT risk mitigation)
  const riskAvoidanceBenefit = totalCosts * 0.1;
  
  // Total quantified benefits
  const totalBenefits = productivityBenefit + revenueBenefit + riskAvoidanceBenefit;
  
  // === ROI & INVESTMENT METRICS ===
  const netBenefit = totalBenefits - totalCosts;
  const roi = totalCosts > 0 ? ((totalBenefits - totalCosts) / totalCosts) * 100 : 0;
  
  // Payback period (months) - critical for investment decisions
  const monthlyBenefit = totalBenefits / 12;
  const paybackMonths = monthlyBenefit > 0 ? totalCosts / monthlyBenefit : 0;
  
  // Net Present Value (NPV) - assuming 3-year investment horizon at 8% discount rate
  const discountRate = 0.08;
  const years = 3;
  let npv = -totalCosts; // Initial investment (negative cash flow)
  for (let year = 1; year <= years; year++) {
    npv += (totalBenefits / years) / Math.pow(1 + discountRate, year);
  }
  
  // Internal Rate of Return (IRR) approximation
  const irr = totalBenefits > totalCosts ? 
    Math.pow(totalBenefits / totalCosts, 1/years) - 1 : 0;
  
  // === EFFICIENCY METRICS ===
  // Benefit per employee
  const benefitPerEmployee = totalEmployees > 0 ? totalBenefits / totalEmployees : 0;
  
  // Cost efficiency ratio (benefits per dollar invested)
  const costEfficiencyRatio = totalCosts > 0 ? totalBenefits / totalCosts : 0;
  
  // === BUSINESS INSIGHTS ===
  const insights = generateBusinessInsights({
    totalCosts,
    totalBenefits,
    roi,
    paybackMonths,
    npv,
    irr,
    costPerEmployee,
    benefitPerEmployee,
    departmentCosts,
    l2Data
  });
  
  console.log(`[L4-CALC] Comprehensive analysis - ROI: ${roi.toFixed(1)}%, Payback: ${paybackMonths.toFixed(1)} months, NPV: $${npv.toLocaleString()}`);
  
  return {
    // Core financial metrics
    totalRevenue: totalBenefits,
    totalCosts: totalCosts,
    netBenefit: netBenefit,
    roi: roi,
    
    // Investment decision metrics
    paybackMonths: paybackMonths,
    npv: npv,
    irr: irr * 100, // Convert to percentage
    
    // Efficiency metrics
    costPerEmployee: costPerEmployee,
    benefitPerEmployee: benefitPerEmployee,
    costEfficiencyRatio: costEfficiencyRatio,
    
    // Detailed breakdown
    benefitBreakdown: {
      productivity: productivityBenefit,
      revenue: revenueBenefit,
      riskAvoidance: riskAvoidanceBenefit
    },
    
    departmentCosts: departmentCosts,
    insights: insights,
    assumptions,
    dataCount: { l1: l1Data.length, l2: l2Data.length, l3: l3Data.length }
  };
}

/** Generate actionable business insights for technology investment decisions */
function generateBusinessInsights(metrics: any) {
  const insights = [];
  
  // Investment viability assessment
  if (metrics.roi < 0) {
    insights.push({
      type: 'error',
      category: 'Investment Viability',
      title: 'Negative ROI - Investment Not Recommended',
      message: `This technology investment shows a negative ROI of ${metrics.roi.toFixed(1)}%. Consider revising the business case or exploring alternative solutions.`,
      impact: 'Critical'
    });
  } else if (metrics.roi < 15) {
    insights.push({
      type: 'warning',
      category: 'Investment Viability',
      title: 'Low ROI - Consider Alternatives',
      message: `ROI of ${metrics.roi.toFixed(1)}% is below typical technology investment thresholds (15-25%). Review assumptions and consider cost optimization.`,
      impact: 'High'
    });
  } else if (metrics.roi > 50) {
    insights.push({
      type: 'success',
      category: 'Investment Viability',
      title: 'Excellent ROI - Strong Investment Case',
      message: `ROI of ${metrics.roi.toFixed(1)}% exceeds industry benchmarks. This represents a compelling technology investment opportunity.`,
      impact: 'High'
    });
  }
  
  // Payback period analysis
  if (metrics.paybackMonths > 36) {
    insights.push({
      type: 'warning',
      category: 'Payback Analysis',
      title: 'Long Payback Period',
      message: `Payback period of ${metrics.paybackMonths.toFixed(1)} months exceeds typical technology investment cycles. Consider phased implementation or alternative financing.`,
      impact: 'Medium'
    });
  } else if (metrics.paybackMonths < 12) {
    insights.push({
      type: 'success',
      category: 'Payback Analysis',
      title: 'Quick Payback - Low Risk Investment',
      message: `Payback period of ${metrics.paybackMonths.toFixed(1)} months indicates a low-risk, high-return investment opportunity.`,
      impact: 'High'
    });
  }
  
  // NPV analysis
  if (metrics.npv < 0) {
    insights.push({
      type: 'error',
      category: 'Financial Analysis',
      title: 'Negative NPV - Value Destruction',
      message: `Net Present Value of $${metrics.npv.toLocaleString()} indicates this investment destroys shareholder value. Reconsider the business case.`,
      impact: 'Critical'
    });
  } else if (metrics.npv > 0) {
    insights.push({
      type: 'success',
      category: 'Financial Analysis',
      title: 'Positive NPV - Value Creation',
      message: `Net Present Value of $${metrics.npv.toLocaleString()} indicates this investment creates shareholder value and should be pursued.`,
      impact: 'High'
    });
  }
  
  // Cost efficiency analysis
  if (metrics.costPerEmployee > 15000) {
    insights.push({
      type: 'warning',
      category: 'Cost Efficiency',
      title: 'High IT Cost Per Employee',
      message: `IT cost per employee of $${metrics.costPerEmployee.toLocaleString()} is above industry average. Focus on cost optimization and efficiency improvements.`,
      impact: 'Medium'
    });
  }
  
  // Department allocation insights
  const highestCostDept = Object.entries(metrics.departmentCosts).reduce((a, b) => 
    metrics.departmentCosts[a[0]] > metrics.departmentCosts[b[0]] ? a : b, ['', 0]);
  
  if (highestCostDept[0]) {
    const deptPercentage = (metrics.departmentCosts[highestCostDept[0]] / metrics.totalCosts) * 100;
    if (deptPercentage > 40) {
      insights.push({
        type: 'info',
        category: 'Cost Allocation',
        title: 'Concentrated Department Spending',
        message: `${highestCostDept[0].replace(/_/g, ' ')} represents ${deptPercentage.toFixed(1)}% of total IT spend. Consider diversification and risk management.`,
        impact: 'Medium'
      });
    }
  }
  
  return insights;
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
      id: snapshot.id,
      companyId: snapshot.companyId,
      period: snapshot.period,
      assumptions: snapshot.assumptions ? JSON.parse(snapshot.assumptions) : null,
      totalCost: snapshot.totalCost,
      totalBenefit: snapshot.totalBenefit,
      net: snapshot.totalBenefit - snapshot.totalCost,
      roiPct: snapshot.roiPct,
      createdAt: snapshot.createdAt
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
r.post('/snapshot', postSnapshot);
r.get('/snapshots/:companyId', getSnapshots);

export default r;