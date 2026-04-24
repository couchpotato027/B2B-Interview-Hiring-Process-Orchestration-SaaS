import { Request, Response, NextFunction } from 'express';
import { auditService } from '../../application/services/AuditService';
import { AuthenticatedRequest } from './AuthMiddleware';

/**
 * Middleware to log specific sensitive data access
 */
export const auditDataView = (resource: 'Candidate' | 'Job' | 'Evaluation') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const tenantId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);
    const userId = authReq.user?.userId;
    const resourceId = req.params.id || req.params.candidateId;

    if (tenantId && resourceId) {
      // We log even if the request fails later (attempted access)
      await auditService.log({
        tenantId,
        userId,
        action: 'VIEW',
        resource,
        resourceId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }
    next();
  };
};

/**
 * Utility to capture changes for audit logging
 */
export const captureChanges = (original: any, updated: any) => {
  const changes: any[] = [];
  
  for (const key in updated) {
    if (JSON.stringify(original[key]) !== JSON.stringify(updated[key])) {
      changes.push({
        field: key,
        before: original[key],
        after: updated[key]
      });
    }
  }
  
  return changes;
};

/**
 * Global middleware to log mutations
 */
export const auditMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
      // Just a placeholder log for the mutation attempt
      // Controllers will log specific detail via AuditService
      console.log(`[Audit] ${authReq.user.userId} attempting ${req.method} on ${req.url}`);
    }
  }
  next();
};
