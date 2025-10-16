import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

// ===== BUSINESS UNITS (Layer 1) =====

// Get all business units for a company
router.get('/business-units', authenticateToken, async (req, res) => {
  try {
    const { companyId, period } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const businessUnits = await prisma.businessUnitModel.findMany({
      where: {
        companyId: companyId as string,
        ...(period && { period: new Date(period as string) })
      },
      include: {
        services: {
          include: {
            itTowers: {
              include: {
                itTower: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(businessUnits);
  } catch (error) {
    console.error('Error fetching business units:', error);
    res.status(500).json({ error: 'Failed to fetch business units' });
  }
});

// Create or update business unit
router.post('/business-units', authenticateToken, async (req, res) => {
  try {
    const { companyId, name, type, description, budget, employees, period } = req.body;
    const userId = req.user?.id;

    if (!companyId || !name || !type || !budget || !employees || !period) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const businessUnit = await prisma.businessUnitModel.upsert({
      where: {
        companyId_period_name: {
          companyId,
          period: new Date(period),
          name
        }
      },
      update: {
        type,
        description,
        budget,
        employees,
        createdById: userId
      },
      create: {
        companyId,
        name,
        type,
        description,
        budget,
        employees,
        period: new Date(period),
        createdById: userId
      }
    });

    res.json(businessUnit);
  } catch (error) {
    console.error('Error creating/updating business unit:', error);
    res.status(500).json({ error: 'Failed to create/update business unit' });
  }
});

// ===== SERVICES (Layer 2) =====

// Get all services for a company
router.get('/services', authenticateToken, async (req, res) => {
  try {
    const { companyId, period, businessUnitId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const services = await prisma.service.findMany({
      where: {
        companyId: companyId as string,
        ...(period && { period: new Date(period as string) }),
        ...(businessUnitId && { businessUnitId: businessUnitId as string })
      },
      include: {
        businessUnit: true,
        itTowers: {
          include: {
            itTower: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Create or update service
router.post('/services', authenticateToken, async (req, res) => {
  try {
    const { 
      companyId, 
      businessUnitId, 
      name, 
      type, 
      description, 
      cost, 
      slaLevel, 
      utilization, 
      period,
      itTowerAllocations 
    } = req.body;
    const userId = req.user?.id;

    if (!companyId || !businessUnitId || !name || !type || !cost || !period) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const service = await prisma.service.upsert({
      where: {
        companyId_period_name: {
          companyId,
          period: new Date(period),
          name
        }
      },
      update: {
        businessUnitId,
        type,
        description,
        cost,
        slaLevel,
        utilization,
        createdById: userId
      },
      create: {
        companyId,
        businessUnitId,
        name,
        type,
        description,
        cost,
        slaLevel,
        utilization,
        period: new Date(period),
        createdById: userId
      }
    });

    // Handle IT tower allocations if provided
    if (itTowerAllocations && Array.isArray(itTowerAllocations)) {
      // Delete existing allocations
      await prisma.serviceItTower.deleteMany({
        where: { serviceId: service.id }
      });

      // Create new allocations
      for (const allocation of itTowerAllocations) {
        await prisma.serviceItTower.create({
          data: {
            serviceId: service.id,
            itTowerId: allocation.itTowerId,
            weight: allocation.weight
          }
        });
      }
    }

    res.json(service);
  } catch (error) {
    console.error('Error creating/updating service:', error);
    res.status(500).json({ error: 'Failed to create/update service' });
  }
});

// ===== IT TOWERS (Layer 3) =====

// Get all IT towers for a company
router.get('/it-towers', authenticateToken, async (req, res) => {
  try {
    const { companyId, period } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const itTowers = await prisma.itTowerModel.findMany({
      where: {
        companyId: companyId as string,
        ...(period && { period: new Date(period as string) })
      },
      include: {
        services: {
          include: {
            service: true
          }
        },
        costPools: {
          include: {
            costPool: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(itTowers);
  } catch (error) {
    console.error('Error fetching IT towers:', error);
    res.status(500).json({ error: 'Failed to fetch IT towers' });
  }
});

// Create or update IT tower
router.post('/it-towers', authenticateToken, async (req, res) => {
  try {
    const { 
      companyId, 
      name, 
      type, 
      description, 
      cost, 
      capacity, 
      utilization, 
      period,
      costPoolAllocations 
    } = req.body;
    const userId = req.user?.id;

    if (!companyId || !name || !type || !cost || !period) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const itTower = await prisma.itTowerModel.upsert({
      where: {
        companyId_period_name: {
          companyId,
          period: new Date(period),
          name
        }
      },
      update: {
        type,
        description,
        cost,
        capacity,
        utilization,
        createdById: userId
      },
      create: {
        companyId,
        name,
        type,
        description,
        cost,
        capacity,
        utilization,
        period: new Date(period),
        createdById: userId
      }
    });

    // Handle cost pool allocations if provided
    if (costPoolAllocations && Array.isArray(costPoolAllocations)) {
      // Delete existing allocations
      await prisma.itTowerCostPool.deleteMany({
        where: { itTowerId: itTower.id }
      });

      // Create new allocations
      for (const allocation of costPoolAllocations) {
        await prisma.itTowerCostPool.create({
          data: {
            itTowerId: itTower.id,
            costPoolId: allocation.costPoolId,
            amount: allocation.amount
          }
        });
      }
    }

    res.json(itTower);
  } catch (error) {
    console.error('Error creating/updating IT tower:', error);
    res.status(500).json({ error: 'Failed to create/update IT tower' });
  }
});

// ===== COST POOLS (Layer 4) =====

// Get all cost pools for a company
router.get('/cost-pools', authenticateToken, async (req, res) => {
  try {
    const { companyId, period } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const costPools = await prisma.costPoolModel.findMany({
      where: {
        companyId: companyId as string,
        ...(period && { period: new Date(period as string) })
      },
      include: {
        itTowers: {
          include: {
            itTower: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(costPools);
  } catch (error) {
    console.error('Error fetching cost pools:', error);
    res.status(500).json({ error: 'Failed to fetch cost pools' });
  }
});

// Create or update cost pool
router.post('/cost-pools', authenticateToken, async (req, res) => {
  try {
    const { companyId, name, type, description, amount, period } = req.body;
    const userId = req.user?.id;

    if (!companyId || !name || !type || !amount || !period) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const costPool = await prisma.costPoolModel.upsert({
      where: {
        companyId_period_name: {
          companyId,
          period: new Date(period),
          name
        }
      },
      update: {
        type,
        description,
        amount,
        createdById: userId
      },
      create: {
        companyId,
        name,
        type,
        description,
        amount,
        period: new Date(period),
        createdById: userId
      }
    });

    res.json(costPool);
  } catch (error) {
    console.error('Error creating/updating cost pool:', error);
    res.status(500).json({ error: 'Failed to create/update cost pool' });
  }
});

// ===== BUSINESS INSIGHTS =====

// Get business insights for a company
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const { companyId, period, category } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const insights = await prisma.businessInsight.findMany({
      where: {
        companyId: companyId as string,
        ...(period && { period: new Date(period as string) }),
        ...(category && { category: category as any })
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(insights);
  } catch (error) {
    console.error('Error fetching business insights:', error);
    res.status(500).json({ error: 'Failed to fetch business insights' });
  }
});

// Generate business insights
router.post('/insights/generate', authenticateToken, async (req, res) => {
  try {
    const { companyId, period } = req.body;
    const userId = req.user?.id;

    if (!companyId || !period) {
      return res.status(400).json({ error: 'Company ID and period are required' });
    }

    // Get all framework data for analysis
    const [businessUnits, services, itTowers, costPools] = await Promise.all([
      prisma.businessUnitModel.findMany({
        where: { companyId, period: new Date(period) },
        include: { services: true }
      }),
      prisma.service.findMany({
        where: { companyId, period: new Date(period) },
        include: { itTowers: { include: { itTower: true } } }
      }),
      prisma.itTowerModel.findMany({
        where: { companyId, period: new Date(period) },
        include: { costPools: { include: { costPool: true } } }
      }),
      prisma.costPoolModel.findMany({
        where: { companyId, period: new Date(period) }
      })
    ]);

    const insights = [];

    // Cost optimization insights
    const totalCost = costPools.reduce((sum, pool) => sum + Number(pool.amount), 0);
    const avgUtilization = itTowers
      .filter(tower => tower.utilization !== null)
      .reduce((sum, tower) => sum + Number(tower.utilization || 0), 0) / itTowers.length;

    if (avgUtilization < 70) {
      insights.push({
        title: "Low Infrastructure Utilization",
        category: "COST_OPTIMIZATION",
        description: "Infrastructure utilization analysis",
        insight: `Average IT tower utilization is ${avgUtilization.toFixed(1)}%, indicating potential for cost optimization through right-sizing or consolidation.`,
        impact: "High",
        confidence: 0.85,
        period: new Date(period),
        data: { avgUtilization, totalTowers: itTowers.length }
      });
    }

    // Performance analysis insights
    const servicesWithLowUtilization = services.filter(service => 
      service.utilization && Number(service.utilization) < 60
    );

    if (servicesWithLowUtilization.length > 0) {
      insights.push({
        title: "Underutilized Services",
        category: "PERFORMANCE_ANALYSIS",
        description: "Service utilization analysis",
        insight: `${servicesWithLowUtilization.length} services are operating below 60% utilization, suggesting potential for optimization or consolidation.`,
        impact: "Medium",
        confidence: 0.75,
        period: new Date(period),
        data: { underutilizedServices: servicesWithLowUtilization.length, totalServices: services.length }
      });
    }

    // Capacity planning insights
    const highUtilizationTowers = itTowers.filter(tower => 
      tower.utilization && Number(tower.utilization) > 85
    );

    if (highUtilizationTowers.length > 0) {
      insights.push({
        title: "High Utilization Warning",
        category: "CAPACITY_PLANNING",
        description: "Capacity planning analysis",
        insight: `${highUtilizationTowers.length} IT towers are operating above 85% utilization, indicating potential capacity constraints.`,
        impact: "High",
        confidence: 0.90,
        period: new Date(period),
        data: { highUtilizationTowers: highUtilizationTowers.length, totalTowers: itTowers.length }
      });
    }

    // Strategic alignment insights
    const businessUnitCount = businessUnits.length;
    const serviceCount = services.length;
    const servicesPerUnit = serviceCount / businessUnitCount;

    if (servicesPerUnit < 2) {
      insights.push({
        title: "Low Service Density",
        category: "STRATEGIC_ALIGNMENT",
        description: "Business unit service alignment",
        insight: `Average of ${servicesPerUnit.toFixed(1)} services per business unit suggests potential for better IT service alignment with business needs.`,
        impact: "Medium",
        confidence: 0.70,
        period: new Date(period),
        data: { servicesPerUnit, businessUnitCount, serviceCount }
      });
    }

    // Save insights to database
    const savedInsights = await Promise.all(
      insights.map(insight => 
        prisma.businessInsight.create({
          data: {
            ...insight,
            companyId,
            createdById: userId
          }
        })
      )
    );

    res.json(savedInsights);
  } catch (error) {
    console.error('Error generating business insights:', error);
    res.status(500).json({ error: 'Failed to generate business insights' });
  }
});

// ===== FRAMEWORK OVERVIEW =====

// Get complete framework overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const { companyId, period } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const [businessUnits, services, itTowers, costPools, insights] = await Promise.all([
      prisma.businessUnitModel.findMany({
        where: { companyId: companyId as string, period: new Date(period as string) },
        include: { services: true }
      }),
      prisma.service.findMany({
        where: { companyId: companyId as string, period: new Date(period as string) },
        include: { businessUnit: true, itTowers: { include: { itTower: true } } }
      }),
      prisma.itTowerModel.findMany({
        where: { companyId: companyId as string, period: new Date(period as string) },
        include: { costPools: { include: { costPool: true } } }
      }),
      prisma.costPoolModel.findMany({
        where: { companyId: companyId as string, period: new Date(period as string) }
      }),
      prisma.businessInsight.findMany({
        where: { companyId: companyId as string, period: new Date(period as string) },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Calculate summary metrics
    const totalBudget = businessUnits.reduce((sum, unit) => sum + Number(unit.budget), 0);
    const totalCost = costPools.reduce((sum, pool) => sum + Number(pool.amount), 0);
    const totalEmployees = businessUnits.reduce((sum, unit) => sum + unit.employees, 0);
    const avgUtilization = itTowers
      .filter(tower => tower.utilization !== null)
      .reduce((sum, tower) => sum + Number(tower.utilization || 0), 0) / itTowers.length || 0;

    const overview = {
      summary: {
        totalBudget,
        totalCost,
        totalEmployees,
        avgUtilization: avgUtilization || 0,
        businessUnitCount: businessUnits.length,
        serviceCount: services.length,
        itTowerCount: itTowers.length,
        costPoolCount: costPools.length
      },
      businessUnits,
      services,
      itTowers,
      costPools,
      recentInsights: insights
    };

    res.json(overview);
  } catch (error) {
    console.error('Error fetching framework overview:', error);
    res.status(500).json({ error: 'Failed to fetch framework overview' });
  }
});

export default router;
