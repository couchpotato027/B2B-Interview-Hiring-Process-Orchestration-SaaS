import { Router } from 'express';
import { createJob, listJobs, getJob, updateJob, archiveJob } from './job.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';
import { requireRole } from '../../shared/middlewares/rbac.middleware';

const router = Router();

router.use(tenantContextMiddleware);

router.get('/', listJobs);
router.post('/', requireRole('ADMIN', 'RECRUITER'), createJob);
router.get('/:id', getJob);
router.put('/:id', requireRole('ADMIN', 'RECRUITER'), updateJob);
router.delete('/:id', requireRole('ADMIN'), archiveJob);

export default router;
