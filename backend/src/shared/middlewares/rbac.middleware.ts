import { Response, NextFunction } from 'express';
import { AppRequest } from './tenantContext.middleware';

export const requireRole = (...allowedRoles: string[]) => {
    return (req: AppRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: { message: 'Authentication required' } });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: { message: 'Insufficient permissions' } });
            return;
        }

        next();
    };
};
