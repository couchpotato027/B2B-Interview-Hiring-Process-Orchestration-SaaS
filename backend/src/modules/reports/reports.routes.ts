import { Router } from 'express';
import { getHiringFunnel, getStageDropoff, getTimeToHireTrend, getOfferAcceptanceRate } from './reports.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';

const router = Router();

router.use(tenantContextMiddleware);

router.get('/funnel', getHiringFunnel);
router.get('/dropoff', getStageDropoff);
router.get('/time-to-hire', getTimeToHireTrend);
router.get('/offer-rate', getOfferAcceptanceRate);

export default router;
