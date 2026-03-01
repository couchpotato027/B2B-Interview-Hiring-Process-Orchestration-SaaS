import { Router } from 'express';
import { createPipeline } from './pipeline.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';

const router = Router();

router.use(tenantContextMiddleware);

router.post('/', createPipeline);

export default router;
