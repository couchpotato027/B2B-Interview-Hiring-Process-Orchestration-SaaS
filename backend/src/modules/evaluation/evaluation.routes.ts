import { Router } from 'express';
import { submitFeedback, aggregateDecision } from './evaluation.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';

const router = Router();

router.use(tenantContextMiddleware);

router.post('/', submitFeedback);
router.post('/aggregate/:candidateId', aggregateDecision);

export default router;
