import { Response, NextFunction } from 'express';
import { AppRequest } from './tenantContext.middleware';
import { PermissionService, Resource, Action } from '../services/PermissionService';

export const requirePermission = (resource: Resource, action: Action) => {
    return (req: AppRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: { message: 'Authentication required' } });
            return;
        }

        if (!PermissionService.can(req.user.role, action, resource)) {
            res.status(403).json({ error: { message: `Insufficient permissions: Cannot ${action} on ${resource}` } });
            return;
        }

        next();
    };
};
