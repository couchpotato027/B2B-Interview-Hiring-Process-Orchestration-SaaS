import { Router } from 'express';
import { scheduleInterview, listInterviews, updateInterview } from './interview.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';
import { requirePermission } from '../../shared/middlewares/rbac.middleware';

const router = Router();

router.use(tenantContextMiddleware);

router.get('/', requirePermission('Interview', 'READ'), listInterviews);
router.post('/', requirePermission('Interview', 'CREATE'), scheduleInterview);
router.put('/:id', requirePermission('Interview', 'UPDATE'), updateInterview);

export default router;
