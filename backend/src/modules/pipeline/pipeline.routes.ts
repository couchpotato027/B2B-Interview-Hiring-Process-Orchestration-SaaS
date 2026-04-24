import { Router } from 'express';
import { createPipeline, listPipelines, getPipeline, updatePipeline, deletePipeline, reorderStages, addStage, deleteStage } from './pipeline.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';
import { requirePermission } from '../../shared/middlewares/rbac.middleware';

const router = Router();

router.use(tenantContextMiddleware);

router.get('/', requirePermission('Pipeline', 'READ'), listPipelines);
router.post('/', requirePermission('Pipeline', 'CREATE'), createPipeline);
router.get('/:id', requirePermission('Pipeline', 'READ'), getPipeline);
router.put('/:id', requirePermission('Pipeline', 'UPDATE'), updatePipeline);
router.delete('/:id', requirePermission('Pipeline', 'DELETE'), deletePipeline);
router.put('/:id/reorder', requirePermission('Pipeline', 'UPDATE'), reorderStages);
router.post('/:id/stages', requirePermission('Pipeline', 'UPDATE'), addStage);
router.delete('/:id/stages/:stageId', requirePermission('Pipeline', 'DELETE'), deleteStage);

export default router;
