import { Router } from 'express';
import { scheduleInterview, listInterviews, updateInterview } from './interview.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';
import { requireRole } from '../../shared/middlewares/rbac.middleware';

const router = Router();

router.use(tenantContextMiddleware);

router.get('/', listInterviews);
router.post('/', requireRole('ADMIN', 'RECRUITER'), scheduleInterview);
router.put('/:id', requireRole('ADMIN', 'RECRUITER'), updateInterview);

export default router;
