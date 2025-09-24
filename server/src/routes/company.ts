import { Router } from 'express';
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";
import { requireAdmin } from '../middleware/rbac.js';

const r = Router();

r.get('/', auth(), requireAdmin, async (_req, res) => {
    const companies = await prisma.company.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(companies);
});

export default r;