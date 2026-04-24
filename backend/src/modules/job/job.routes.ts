import { Router } from 'express';
import { createJob, listJobs, getJob, updateJob, archiveJob } from './job.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';
import { requirePermission } from '../../shared/middlewares/rbac.middleware';

const router = Router();

router.use(tenantContextMiddleware);

router.get('/', requirePermission('Job', 'READ'), listJobs);
router.post('/', requirePermission('Job', 'CREATE'), createJob);
router.get('/:id', requirePermission('Job', 'READ'), getJob);
router.put('/:id', requirePermission('Job', 'UPDATE'), updateJob);
router.delete('/:id', requirePermission('Job', 'DELETE'), archiveJob);

export default router;
