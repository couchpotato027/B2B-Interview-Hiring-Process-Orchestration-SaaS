import { Router } from 'express';
import { getAuditLogs } from './audit.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';
import { requireRole } from '../../shared/middlewares/rbac.middleware';

const router = Router();

router.use(tenantContextMiddleware);

router.get('/', requireRole('ADMIN'), getAuditLogs);

export default router;
