import { Router } from 'express';
import { getAuditLogs } from './audit.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';
import { requirePermission } from '../../shared/middlewares/rbac.middleware';

const router = Router();

router.use(tenantContextMiddleware);

router.get('/', requirePermission('AuditLog', 'READ'), getAuditLogs);

export default router;
