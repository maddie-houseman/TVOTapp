import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTbmData() {
  console.log('🌱 Seeding TBM reference data...');

  // Get all companies
  const companies = await prisma.company.findMany();
  
  if (companies.length === 0) {
    console.log('❌ No companies found. Please create a company first.');
    return;
  }

  for (const company of companies) {
    console.log(`📊 Seeding data for company: ${company.name}`);

    // 1. Create departments from enum values
    const departmentNames = [
      'ENGINEERING',
      'SALES', 
      'MARKETING',
      'FINANCE',
      'HR',
      'OPERATIONS',
      'OTHER'
    ];

    for (const deptName of departmentNames) {
      await prisma.departmentModel.upsert({
        where: {
          companyId_name: {
            companyId: company.id,
            name: deptName
          }
        },
        update: {},
        create: {
          companyId: company.id,
          name: deptName
        }
      });
    }

    // 2. Create default cost pool
    const defaultCostPool = await prisma.costPool.upsert({
      where: {
        companyId_name: {
          companyId: company.id,
          name: 'Department IT Budget'
        }
      },
      update: {},
      create: {
        companyId: company.id,
        name: 'Department IT Budget',
        capexOpex: 'OPEX'
      }
    });

    // 3. Create resource towers
    const towers = [
      { group: 'APPLICATION' as const, name: 'Application Development' },
      { group: 'DELIVERY' as const, name: 'Delivery Services' },
      { group: 'DATA' as const, name: 'Data Services' },
      { group: 'SECURITY' as const, name: 'Security & Compliance' },
      { group: 'COMPUTE' as const, name: 'Compute Services' },
      { group: 'STORAGE' as const, name: 'Storage Services' },
      { group: 'NETWORK' as const, name: 'Network Services' },
      { group: 'END_USER' as const, name: 'End User Computing' },
      { group: 'DATA_CENTER' as const, name: 'Data Center' },
      { group: 'CLOUD' as const, name: 'Cloud Services' }
    ];

    for (const tower of towers) {
      await prisma.resourceTower.upsert({
        where: {
          companyId_towerName: {
            companyId: company.id,
            towerName: tower.name
          }
        },
        update: {},
        create: {
          companyId: company.id,
          towerGroup: tower.group,
          towerName: tower.name
        }
      });
    }

    // 4. Create default solutions for each department
    const departments = await prisma.departmentModel.findMany({
      where: { companyId: company.id }
    });

    for (const dept of departments) {
      await prisma.solution.upsert({
        where: {
          companyId_name: {
            companyId: company.id,
            name: `Run - ${dept.name}`
          }
        },
        update: {},
        create: {
          companyId: company.id,
          departmentId: dept.id,
          name: `Run - ${dept.name}`,
          owner: dept.name,
          isInitiative: false
        }
      });
    }

    // 5. Create benefit metrics
    const benefitMetrics = [
      { name: 'Productivity', unit: 'hours', category: 'PRODUCTIVITY' as const },
      { name: 'Revenue Uplift', unit: 'USD', category: 'REVENUE_UPLIFT' as const },
      { name: 'Risk Reduction', unit: 'USD', category: 'RISK_AVOIDANCE' as const },
      { name: 'Cost Avoidance', unit: 'USD', category: 'COST_AVOIDANCE' as const }
    ];

    for (const metric of benefitMetrics) {
      await prisma.benefitMetric.upsert({
        where: {
          companyId_name: {
            companyId: company.id,
            name: metric.name
          }
        },
        update: {},
        create: {
          companyId: company.id,
          name: metric.name,
          unit: metric.unit,
          category: metric.category
        }
      });
    }

    console.log(`✅ Seeded TBM data for ${company.name}`);
  }

  console.log('🎉 TBM seeding completed!');
}

async function main() {
  try {
    await seedTbmData();
  } catch (error) {
    console.error('❌ Error seeding TBM data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
