import { Router } from 'express';
import { addCandidate, listCandidates, getCandidate, updateCandidate, deleteCandidate, moveCandidateStage, rejectCandidate, hireCandidate, bulkUpdateCandidates } from './candidate.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';
import { requirePermission } from '../../shared/middlewares/rbac.middleware';

const router = Router();

router.use(tenantContextMiddleware); // Enforce multi-tenancy context

router.get('/', requirePermission('Candidate', 'READ'), listCandidates);
router.post('/', requirePermission('Candidate', 'CREATE'), addCandidate);
router.post('/bulk-update', requirePermission('Candidate', 'UPDATE'), bulkUpdateCandidates);
router.get('/:id', requirePermission('Candidate', 'READ'), getCandidate);
router.put('/:id', requirePermission('Candidate', 'UPDATE'), updateCandidate);
router.delete('/:id', requirePermission('Candidate', 'DELETE'), deleteCandidate);
router.put('/:id/stage', requirePermission('Candidate', 'UPDATE'), moveCandidateStage);
router.post('/:id/reject', requirePermission('Candidate', 'UPDATE'), rejectCandidate);
router.post('/:id/hire', requirePermission('Candidate', 'UPDATE'), hireCandidate);

export default router;
