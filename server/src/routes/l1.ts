import { Router } from 'express';
import { prisma } from '../prisma.js';
import { auth } from '../middleware/auth.js';
import { restrictToCompany } from '../middleware/rbac.js';
import { l1Schema } from '../utils/validators.js';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const r = Router();

r.get('/:companyId/:period', auth(), restrictToCompany, async (req, res) => {
    const { companyId, period } = req.params;
    const data = await prisma.l1OperationalInput.findMany({ where: { companyId, period: new Date(period) } });
    res.json(data);
});

// Handle POST requests to /api/l1
r.post('/', auth(), async (req, res) => {
    console.log('L1 POST route hit:', req.path, req.method);
    console.log('User:', { role: req.user!.role, companyId: req.user!.companyId });
    const body = l1Schema.parse(req.body);
    console.log('Request body companyId:', body.companyId);
    // For non-admin users, they can only access their own company's data
    // For admin users, they can access any company's data
    if (req.user!.role !== 'ADMIN' && req.user!.companyId !== body.companyId) {
        console.log('Authorization failed: user companyId does not match request companyId');
        return res.status(403).json({ error: 'Forbidden' });
    }
    
    // For admin users, if no companyId is provided, use their own company
    if (req.user!.role === 'ADMIN' && !body.companyId && req.user!.companyId) {
        body.companyId = req.user!.companyId;
    }
    const created = await prisma.l1OperationalInput.upsert({
        where: { companyId_period_department: { companyId: body.companyId, period: new Date(body.period), department: body.department } },
        create: { ...body, period: new Date(body.period), createdById: req.user!.userId },
        update: { employees: body.employees, budget: new Decimal(body.budget), baselineKpi: body.baselineKpi ?? null }
    });
    res.json(created);
});

export default r;