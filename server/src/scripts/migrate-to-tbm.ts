import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToTbm() {
  console.log('🔄 Migrating existing L1-L4 data to TBM structure...');

  // Get all companies
  const companies = await prisma.company.findMany();
  
  if (companies.length === 0) {
    console.log('❌ No companies found.');
    return;
  }

  for (const company of companies) {
    console.log(`📊 Migrating data for company: ${company.name}`);

    // Get or create default cost pool
    const defaultCostPool = await prisma.costPool.findFirst({
      where: {
        companyId: company.id,
        name: 'Department IT Budget'
      }
    });

    if (!defaultCostPool) {
      console.log('❌ Default cost pool not found. Please run seed-tbm.ts first.');
      continue;
    }

    // Get departments
    const departments = await prisma.departmentModel.findMany({
      where: { companyId: company.id }
    });

    // Get resource towers
    const towers = await prisma.resourceTower.findMany({
      where: { companyId: company.id }
    });

    // Get solutions
    const solutions = await prisma.solution.findMany({
      where: { companyId: company.id }
    });

    // 1. Migrate L1 data to cost pool spend
    const l1Inputs = await prisma.l1OperationalInput.findMany({
      where: { companyId: company.id }
    });

    for (const l1 of l1Inputs) {
      const dept = departments.find(d => d.name === l1.department);
      if (!dept) continue;

      await prisma.costPoolSpend.upsert({
        where: {
          companyId_departmentId_costPoolId_period: {
            companyId: company.id,
            departmentId: dept.id,
            costPoolId: defaultCostPool.id,
            period: l1.period
          }
        },
        update: {
          amount: l1.budget
        },
        create: {
          companyId: company.id,
          departmentId: dept.id,
          costPoolId: defaultCostPool.id,
          period: l1.period,
          amount: l1.budget
        }
      });
    }

    // 2. Migrate L2 data to allocation rules
    const l2Weights = await prisma.l2AllocationWeight.findMany({
      where: { companyId: company.id }
    });

    for (const l2 of l2Weights) {
      const dept = departments.find(d => d.name === l2.department);
      const tower = towers.find(t => {
        // Map old tower names to new ones
        const mapping: Record<string, string> = {
          'APP_DEV': 'Application Development',
          'CLOUD': 'Cloud Services',
          'END_USER': 'End User Computing',
          'SERVICE_DESK': 'Delivery Services',
          'DATA_CENTER': 'Data Center',
          'NETWORK': 'Network Services',
          'SECURITY': 'Security & Compliance'
        };
        return t.towerName === mapping[l2.tower] || t.towerName === l2.tower;
      });

      if (!dept || !tower) continue;

      await prisma.allocationRuleCpToRt.upsert({
        where: {
          companyId_period_departmentId_costPoolId_resourceTowerId: {
            companyId: company.id,
            period: l2.period,
            departmentId: dept.id,
            costPoolId: defaultCostPool.id,
            resourceTowerId: tower.id
          }
        },
        update: {
          percent: l2.weightPct
        },
        create: {
          companyId: company.id,
          period: l2.period,
          departmentId: dept.id,
          costPoolId: defaultCostPool.id,
          resourceTowerId: tower.id,
          percent: l2.weightPct
        }
      });
    }

    // 3. Create default tower-to-solution allocation rules (100% to Run solution)
    for (const dept of departments) {
      const solution = solutions.find(s => s.departmentId === dept.id && s.name === `Run - ${dept.name}`);
      if (!solution) continue;

      for (const tower of towers) {
        await prisma.allocationRuleRtToSol.upsert({
          where: {
            companyId_period_resourceTowerId_solutionId: {
              companyId: company.id,
              period: new Date(), // Use current date as default
              resourceTowerId: tower.id,
              solutionId: solution.id
            }
          },
          update: {
            percent: 1.0 // 100% allocation
          },
          create: {
            companyId: company.id,
            period: new Date(),
            resourceTowerId: tower.id,
            solutionId: solution.id,
            percent: 1.0
          }
        });
      }
    }

    console.log(`✅ Migrated data for ${company.name}`);
  }

  console.log('🎉 Migration completed!');
}

async function main() {
  try {
    await migrateToTbm();
  } catch (error) {
    console.error('❌ Error migrating data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
