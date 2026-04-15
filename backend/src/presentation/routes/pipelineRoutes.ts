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
    new (require('../../application/use-cases/GetPipelinesUseCase').GetPipelinesUseCase)()
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

export { pipelineRouter };
