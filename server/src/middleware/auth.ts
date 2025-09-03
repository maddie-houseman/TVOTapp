import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../env.js';

export type JwtPayload = { userId: string; role: 'EMPLOYEE' | 'ADMIN'; companyId?: string | null };

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export function auth(required = true) {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);
        if (!token) return required ? res.status(401).json({ error: 'Unauthenticated' }) : next();
        try {
            const payload = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
            req.user = payload;
            next();
            } catch {
            return res.status(401).json({ error: 'Invalid token' });
    }
    };
}