import { Router } from 'express';
import { prisma } from '../prisma.js';
import { auth } from '../middleware/auth.js';
import { restrictToCompany } from '../middleware/rbac.js';
import { l1Schema } from '../utils/validators.js';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const r = Router();

r.get('/:companyId/:period', async (req, res) => {
    const { companyId, period } = req.params;
    const data = await prisma.l1OperationalInput.findMany({ where: { companyId, period: new Date(period) } });
    res.json(data);
});

// Handle POST requests to /api/l1
r.post('/', auth(), async (req, res) => {
    const body = l1Schema.parse(req.body);
    
    // For admin users, they can access any company's data
    if (req.user!.role === 'ADMIN') {
        // If no companyId provided, use their own company
        if (!body.companyId && req.user!.companyId) {
            body.companyId = req.user!.companyId;
        }
    } else {
        // For non-admin users, they can only access their own company's data
        if (req.user!.companyId !== body.companyId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
    }

    // Create/update legacy L1 record for backward compatibility
    const created = await prisma.l1OperationalInput.upsert({
        where: { companyId_period_department: { companyId: body.companyId, period: new Date(body.period), department: body.department } },
        create: { ...body, period: new Date(body.period), createdById: req.user!.userId },
        update: { employees: body.employees, budget: new Decimal(body.budget), baselineKpi: body.baselineKpi ?? null }
    });

    // Also create/update TBM cost pool spend
    await upsertTbmCostPoolSpend(body, req.user!.userId);

    res.json(created);
});

// Helper function to create/update TBM cost pool spend
async function upsertTbmCostPoolSpend(body: any, userId: string) {
    // Get or create department
    const department = await prisma.departmentModel.upsert({
        where: {
            companyId_name: {
                companyId: body.companyId,
                name: body.department
            }
        },
        update: {},
        create: {
            companyId: body.companyId,
            name: body.department
        }
    });

    // Get or create default cost pool
    const costPool = await prisma.costPool.upsert({
        where: {
            companyId_name: {
                companyId: body.companyId,
                name: 'Department IT Budget'
            }
        },
        update: {},
        create: {
            companyId: body.companyId,
            name: 'Department IT Budget',
            capexOpex: 'OPEX'
        }
    });

    // Create/update cost pool spend
    await prisma.costPoolSpend.upsert({
        where: {
            companyId_departmentId_costPoolId_period: {
                companyId: body.companyId,
                departmentId: department.id,
                costPoolId: costPool.id,
                period: new Date(body.period)
            }
        },
        update: {
            amount: new Decimal(body.budget)
        },
        create: {
            companyId: body.companyId,
            departmentId: department.id,
            costPoolId: costPool.id,
            period: new Date(body.period),
            amount: new Decimal(body.budget)
        }
    });
}

export default r;