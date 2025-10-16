import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAllocationPipeline(period?: string) {
  const targetPeriod = period ? new Date(period) : new Date();
  console.log(`🔄 Running allocation pipeline for period: ${targetPeriod.toISOString().slice(0, 7)}`);

  // Get all companies
  const companies = await prisma.company.findMany();
  
  for (const company of companies) {
    console.log(`📊 Processing allocations for company: ${company.name}`);

    // Step 1: Compute tower costs from cost pool spend
    await computeTowerCosts(company.id, targetPeriod);

    // Step 2: Compute solution costs from tower costs
    await computeSolutionCosts(company.id, targetPeriod);

    // Step 3: Compute business costs from solution costs
    await computeBusinessCosts(company.id, targetPeriod);

    console.log(`✅ Completed allocations for ${company.name}`);
  }

  console.log('🎉 Allocation pipeline completed!');
}

async function computeTowerCosts(companyId: string, period: Date) {
  console.log(`  🏗️ Computing tower costs...`);

  // Get all cost pool spend for the period
  const costPoolSpend = await prisma.costPoolSpend.findMany({
    where: {
      companyId,
      period: {
        gte: new Date(period.getFullYear(), period.getMonth(), 1),
        lt: new Date(period.getFullYear(), period.getMonth() + 1, 1)
      }
    },
    include: {
      department: true,
      costPool: true
    }
  });

  // Get allocation rules for the period
  const allocationRules = await prisma.allocationRuleCpToRt.findMany({
    where: {
      companyId,
      period: {
        gte: new Date(period.getFullYear(), period.getMonth(), 1),
        lt: new Date(period.getFullYear(), period.getMonth() + 1, 1)
      }
    },
    include: {
      resourceTower: true,
      department: true,
      costPool: true
    }
  });

  // Compute tower costs
  for (const spend of costPoolSpend) {
    const rules = allocationRules.filter(rule => 
      rule.departmentId === spend.departmentId && 
      rule.costPoolId === spend.costPoolId
    );

    for (const rule of rules) {
      const amount = Number(spend.amount) * Number(rule.percent);

      await prisma.towerCost.upsert({
        where: {
          companyId_period_resourceTowerId_departmentId: {
            companyId,
            period: spend.period,
            resourceTowerId: rule.resourceTowerId,
            departmentId: spend.departmentId
          }
        },
        update: {
          amount
        },
        create: {
          companyId,
          period: spend.period,
          resourceTowerId: rule.resourceTowerId,
          departmentId: spend.departmentId,
          amount
        }
      });
    }
  }
}

async function computeSolutionCosts(companyId: string, period: Date) {
  console.log(`  🎯 Computing solution costs...`);

  // Get all tower costs for the period
  const towerCosts = await prisma.towerCost.findMany({
    where: {
      companyId,
      period: {
        gte: new Date(period.getFullYear(), period.getMonth(), 1),
        lt: new Date(period.getFullYear(), period.getMonth() + 1, 1)
      }
    },
    include: {
      resourceTower: true,
      department: true
    }
  });

  // Get tower-to-solution allocation rules
  const allocationRules = await prisma.allocationRuleRtToSol.findMany({
    where: {
      companyId,
      period: {
        gte: new Date(period.getFullYear(), period.getMonth(), 1),
        lt: new Date(period.getFullYear(), period.getMonth() + 1, 1)
      }
    },
    include: {
      solution: true,
      resourceTower: true
    }
  });

  // Compute solution costs
  for (const towerCost of towerCosts) {
    const rules = allocationRules.filter(rule => 
      rule.resourceTowerId === towerCost.resourceTowerId
    );

    for (const rule of rules) {
      const amount = Number(towerCost.amount) * Number(rule.percent);

      await prisma.solutionCost.upsert({
        where: {
          companyId_period_solutionId: {
            companyId,
            period: towerCost.period,
            solutionId: rule.solutionId
          }
        },
        update: {
          amount: {
            increment: amount
          }
        },
        create: {
          companyId,
          period: towerCost.period,
          solutionId: rule.solutionId,
          amount
        }
      });
    }
  }
}

async function computeBusinessCosts(companyId: string, period: Date) {
  console.log(`  💼 Computing business costs...`);

  // Get all solution costs for the period
  const solutionCosts = await prisma.solutionCost.findMany({
    where: {
      companyId,
      period: {
        gte: new Date(period.getFullYear(), period.getMonth(), 1),
        lt: new Date(period.getFullYear(), period.getMonth() + 1, 1)
      }
    },
    include: {
      solution: {
        include: {
          department: true
        }
      }
    }
  });

  // For now, map solution costs directly to business costs by department
  for (const solutionCost of solutionCosts) {
    const businessTag = solutionCost.solution.department.name;

    await prisma.businessCost.upsert({
      where: {
        companyId_period_departmentId_businessTag: {
          companyId,
          period: solutionCost.period,
          departmentId: solutionCost.solution.departmentId,
          businessTag
        }
      },
      update: {
        amount: {
          increment: Number(solutionCost.amount)
        }
      },
      create: {
        companyId,
        period: solutionCost.period,
        departmentId: solutionCost.solution.departmentId,
        businessTag,
        amount: Number(solutionCost.amount)
      }
    });
  }
}

async function main() {
  const period = process.argv[2]; // Optional period argument
  try {
    await runAllocationPipeline(period);
  } catch (error) {
    console.error('❌ Error running allocation pipeline:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
