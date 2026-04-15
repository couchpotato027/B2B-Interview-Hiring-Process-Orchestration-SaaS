import { Router } from 'express';
import { addCandidate, listCandidates, getCandidate, updateCandidate, deleteCandidate, moveCandidateStage, rejectCandidate, hireCandidate, bulkUpdateCandidates } from './candidate.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';
import { requireRole } from '../../shared/middlewares/rbac.middleware';

const router = Router();

router.use(tenantContextMiddleware); // Enforce multi-tenancy context

router.get('/', listCandidates);
router.post('/', requireRole('ADMIN', 'RECRUITER'), addCandidate);
router.post('/bulk-update', requireRole('ADMIN', 'RECRUITER'), bulkUpdateCandidates);
router.get('/:id', getCandidate);
router.put('/:id', requireRole('ADMIN', 'RECRUITER'), updateCandidate);
router.delete('/:id', requireRole('ADMIN', 'RECRUITER'), deleteCandidate);
router.put('/:id/stage', requireRole('ADMIN', 'RECRUITER'), moveCandidateStage);
router.post('/:id/reject', requireRole('ADMIN', 'RECRUITER'), rejectCandidate);
router.post('/:id/hire', requireRole('ADMIN', 'RECRUITER'), hireCandidate);

export default router;
