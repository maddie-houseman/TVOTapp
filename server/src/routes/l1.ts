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

    try {
        const created = await prisma.l1OperationalInput.upsert({
            where: { 
                companyId_period_department: { 
                    companyId: body.companyId, 
                    period: new Date(body.period), 
                    department: body.department 
                } 
            },
            create: { 
                ...body, 
                period: new Date(body.period), 
                createdById: req.user!.userId 
            },
            update: { 
                employees: body.employees, 
                budget: new Decimal(body.budget), 
                baselineKpi: body.baselineKpi ?? null 
            }
        });
        console.log(`[L1 DEBUG] Upserted L1 data for ${body.department}:`, created);
        res.json(created);
    } catch (error) {
        console.error(`[L1 ERROR] Failed to upsert L1 data:`, error);
        res.status(500).json({ error: 'Failed to save L1 data', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});


export default r;