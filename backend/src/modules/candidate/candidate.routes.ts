import { Router } from 'express';
import { addCandidate, moveCandidateStage } from './candidate.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';

const router = Router();

router.use(tenantContextMiddleware); // Enforce multi-tenancy context

router.post('/', addCandidate);
router.post('/:id/transition', moveCandidateStage);

export default router;
