import { Router } from 'express';
import { getStats, getRecentAlerts, getPendingEvaluations } from './dashboard.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';

const router = Router();

router.use(tenantContextMiddleware);

router.get('/stats', getStats);
router.get('/alerts', getRecentAlerts);
router.get('/pending-evaluations', getPendingEvaluations);

export default router;
