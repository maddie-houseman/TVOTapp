import { Request, Response, NextFunction } from 'express';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    next();
};

export const restrictToCompany = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role === 'ADMIN') return next();
    const paramCompanyId = (req.params.companyId || req.body.companyId || req.query.companyId) as string | undefined;
    if (!paramCompanyId) return res.status(400).json({ error: 'companyId required' });
    if (req.user?.companyId !== paramCompanyId) return res.status(403).json({ error: 'Forbidden for this company' });
    next();
};