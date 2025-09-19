import { Router } from 'express';
import { prisma } from '../prisma';
import { auth } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const r = Router();

r.get('/', auth(), requireAdmin, async (_req, res) => {
    const companies = await prisma.company.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(companies);
});

export default r;