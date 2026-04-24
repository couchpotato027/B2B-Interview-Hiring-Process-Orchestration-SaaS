import { Request, Response, NextFunction } from 'express';
import { auditService } from '../../modules/audit/audit.service';
import { AuthenticatedRequest } from './AuthMiddleware';

/**
 * Middleware to automatically log all mutations (POST, PUT, DELETE)
 * Logs resource type based on route and resourceId from params.
 */
export const auditMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Only log mutations and sensitive views
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const isCandidateView = req.method === 'GET' && req.path.match(/^\/[^/]+$/) && req.baseUrl === '/api/v1/candidates';

    // We'll hook into the response finish to log the result
    res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300 && (isMutation || isCandidateView)) {
            const authReq = req as unknown as AuthenticatedRequest;
            if (!authReq.user) return;

            const tenantId = authReq.user.organizationId; // Using organizationId as tenantId
            const userId = authReq.user.id;
            const action = isCandidateView ? 'VIEW' : (req.method === 'POST' ? 'CREATE' : req.method === 'DELETE' ? 'DELETE' : 'UPDATE');
            
            // Infer resource from baseUrl (e.g., /api/v1/candidates -> Candidate)
            const resource = req.baseUrl.split('/').pop()?.replace(/s$/, '') || 'Unknown';
            const resourceId = req.params.id || (res.statusCode === 201 ? (res as any).body?.id : null);

            // For updates, we'd ideally want "before" values, but that requires a decorator or a more complex hook.
            // For now, we log the payload as "after".
            const changes = isMutation ? { payload: req.body } : null;

            try {
                await auditService.log({
                    tenantId,
                    userId,
                    action,
                    resource: resource.charAt(0).toUpperCase() + resource.slice(1),
                    resourceId,
                    changes,
                    ipAddress: req.ip || req.socket.remoteAddress,
                    userAgent: req.get('User-Agent'),
                });
            } catch (err) {
                console.error('Audit logging failed:', err);
            }
        }
    });

    next();
};
