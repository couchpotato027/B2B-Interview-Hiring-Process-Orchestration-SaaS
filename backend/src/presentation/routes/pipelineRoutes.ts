import { Router } from 'express';
import { PipelineController } from '../controllers/PipelineController';
import { Container } from '../../infrastructure/di/Container';

const pipelineRouter = Router();
const container = Container.getInstance();

const getController = () => {
  return new PipelineController(
    container.resolve('CreatePipelineUseCase'),
    container.resolve('MoveCandidateThroughPipelineUseCase'),
    container.resolve('GetPipelineBoardUseCase'),
    container.resolve('BulkMoveCandidatesUseCase'),
    container.resolve('GetPipelinesUseCase')
  );
};

pipelineRouter.get('/', (req, res, next) => getController().listPipelines(req, res, next));
pipelineRouter.get('/:id', (req, res, next) => getController().getBoard(req, res, next)); // Reuse getBoard to provide pipeline context

/**
 * @openapi
 * /pipelines:
 *   post:
 *     tags: [Pipelines]
 *     summary: Create a new pipeline
 *     responses:
 *       201:
 *         description: Pipeline created
 */
pipelineRouter.post('/', (req, res, next) => getController().createPipeline(req, res, next));

/**
 * @openapi
 * /pipelines/templates:
 *   get:
 *     tags: [Pipelines]
 *     summary: Get available pipeline templates
 *     responses:
 *       200:
 *         description: List of templates
 */
pipelineRouter.get('/templates', (req, res) => getController().getTemplates(req, res));

/**
 * @openapi
 * /pipelines/{id}/board:
 *   get:
 *     tags: [Pipelines]
 *     summary: Get Kanban board data for a pipeline
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Board data
 */
pipelineRouter.get('/:id/board', (req, res, next) => getController().getBoard(req, res, next));
pipelineRouter.get('/:id/stages', (req, res, next) => getController().getStages(req, res, next));

/**
 * @openapi
 * /pipelines/bulk-move:
 *   post:
 *     tags: [Pipelines]
 *     summary: Move multiple candidates to a new stage
 *     responses:
 *       200:
 *         description: Bulk move results
 */
pipelineRouter.post('/bulk-move', (req, res, next) => getController().bulkMove(req, res, next));

/**
 * @openapi
 * /candidates/{id}/move:
 *   put:
 *     tags: [Candidates]
 *     summary: Move a candidate to a new pipeline stage
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Candidate moved
 */
pipelineRouter.put('/candidates/:id/move', (req, res, next) => getController().moveCandidate(req, res, next));

// ─── Stage CRUD ──────────────────────────────────────────────────────────────
import { prisma } from '../../infrastructure/database/prisma.client';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';

// Add a stage to a pipeline
pipelineRouter.post('/:id/stages', async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  const tenantId = authReq.user?.organizationId || 'default-tenant';
  const { id } = req.params;
  const { name, slaHours = 48, stageType = 'INTERVIEW', orderIndex } = req.body;

  if (!name) return res.status(400).json({ message: 'Stage name is required.' });

  try {
    const pipeline = await prisma.pipelineTemplate.findFirst({ where: { id, tenantId } });
    if (!pipeline) return res.status(404).json({ message: 'Pipeline not found.' });

    // Auto-calculate orderIndex if not provided
    const maxStage = await prisma.pipelineStage.findFirst({
      where: { pipelineTemplateId: id, tenantId },
      orderBy: { orderIndex: 'desc' },
    });
    const nextIndex = orderIndex ?? ((maxStage?.orderIndex ?? -1) + 1);

    const stage = await prisma.pipelineStage.create({
      data: { tenantId, pipelineTemplateId: id, name, stageType, orderIndex: nextIndex, slaHours },
    });

    return res.status(201).json(stage);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// Update (edit) a stage
pipelineRouter.put('/:id/stages/:stageId', async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  const tenantId = authReq.user?.organizationId || 'default-tenant';
  const { id, stageId } = req.params;
  const { name, slaHours, stageType, orderIndex } = req.body;

  try {
    const stage = await prisma.pipelineStage.findFirst({
      where: { id: stageId, pipelineTemplateId: id, tenantId },
    });
    if (!stage) return res.status(404).json({ message: 'Stage not found.' });

    const updated = await prisma.pipelineStage.update({
      where: { id: stageId },
      data: {
        ...(name !== undefined && { name }),
        ...(slaHours !== undefined && { slaHours }),
        ...(stageType !== undefined && { stageType }),
        ...(orderIndex !== undefined && { orderIndex }),
      },
    });

    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// Delete a stage
pipelineRouter.delete('/:id/stages/:stageId', async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  const tenantId = authReq.user?.organizationId || 'default-tenant';
  const { id, stageId } = req.params;

  try {
    const stage = await prisma.pipelineStage.findFirst({
      where: { id: stageId, pipelineTemplateId: id, tenantId },
    });
    if (!stage) return res.status(404).json({ message: 'Stage not found.' });

    // Check if candidates are in this stage
    const candidateCount = await prisma.candidate.count({ where: { currentStageId: stageId } });
    if (candidateCount > 0) {
      return res.status(400).json({ message: `Cannot delete stage with ${candidateCount} active candidates. Move them first.` });
    }

    await prisma.pipelineStage.delete({ where: { id: stageId } });
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// Delete a pipeline
pipelineRouter.delete('/:id', async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  const tenantId = authReq.user?.organizationId || 'default-tenant';
  const { id } = req.params;

  try {
    const pipeline = await prisma.pipelineTemplate.findFirst({ where: { id, tenantId } });
    if (!pipeline) return res.status(404).json({ message: 'Pipeline not found.' });

    // Cascade: delete stages first, then pipeline
    await prisma.pipelineStage.deleteMany({ where: { pipelineTemplateId: id, tenantId } });
    await prisma.pipelineTemplate.delete({ where: { id } });
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// Update pipeline template name/roleType
pipelineRouter.put('/:id', async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  const tenantId = authReq.user?.organizationId || 'default-tenant';
  const { id } = req.params;
  const { name, roleType } = req.body;

  try {
    const pipeline = await prisma.pipelineTemplate.findFirst({ where: { id, tenantId } });
    if (!pipeline) return res.status(404).json({ message: 'Pipeline not found.' });

    const updated = await prisma.pipelineTemplate.update({
      where: { id },
      data: { ...(name && { name }), ...(roleType && { roleType }) },
      include: { stages: { orderBy: { orderIndex: 'asc' } } },
    });
    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

export { pipelineRouter };
