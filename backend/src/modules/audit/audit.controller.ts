import { Response, NextFunction } from 'express';
import { AppRequest } from '../../shared/middlewares/tenantContext.middleware';
import { auditService } from './audit.service';

export const getAuditLogs = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const filters = {
            page,
            limit,
            userId: req.query.userId as string,
            action: req.query.action as string,
            resource: req.query.resource as string,
        };
        const result = await auditService.getAuditLogs(tenantId, filters);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
