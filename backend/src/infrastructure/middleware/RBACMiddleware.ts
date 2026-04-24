import { Request, Response, NextFunction } from 'express';
import { hasPermission } from '../../shared/Permissions';
import { AuthenticatedRequest } from './AuthMiddleware';
import { auditService } from '../../application/services/AuditService';

export const requirePermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const role = authReq.user?.role;
    const tenantId = authReq.user?.organizationId;
    const userId = authReq.user?.userId;

    if (!role) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (hasPermission(role, resource, action)) {
      return next();
    }

    // Log permission denial for compliance/security
    if (tenantId && userId) {
        await auditService.log({
            tenantId,
            userId,
            action: 'VIEW', // Using VIEW as a base for attempted unauthorized access
            resource: 'Settings', // Log as security attempt
            changes: { attemptedAction: action, attemptedResource: resource, status: 'DENIED' },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
    }

    return res.status(403).json({ 
        error: 'Forbidden', 
        message: `You do not have permission to ${action.toLowerCase()} this ${resource.toLowerCase()}.` 
    });
  };
};
