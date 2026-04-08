import { Router } from 'express';
import { createPipeline, listPipelines, getPipeline, updatePipeline, deletePipeline, reorderStages, addStage, deleteStage } from './pipeline.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';
import { requireRole } from '../../shared/middlewares/rbac.middleware';

const router = Router();

router.use(tenantContextMiddleware);

router.get('/', listPipelines);
router.post('/', requireRole('ADMIN'), createPipeline);
router.get('/:id', getPipeline);
router.put('/:id', requireRole('ADMIN'), updatePipeline);
router.delete('/:id', requireRole('ADMIN'), deletePipeline);
router.put('/:id/reorder', requireRole('ADMIN'), reorderStages);
router.post('/:id/stages', requireRole('ADMIN'), addStage);
router.delete('/:id/stages/:stageId', requireRole('ADMIN'), deleteStage);

export default router;
