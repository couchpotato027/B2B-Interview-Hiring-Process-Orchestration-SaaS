import { Router } from 'express';
import { submitFeedback, listEvaluationsForCandidate, aggregateDecision, getDecision } from './evaluation.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';

const router = Router();

router.use(tenantContextMiddleware);

router.post('/', submitFeedback);
router.get('/candidate/:candidateId', listEvaluationsForCandidate);
router.post('/aggregate/:candidateId', aggregateDecision);
router.get('/decision/:candidateId', getDecision);

export default router;
