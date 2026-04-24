import { Router } from 'express';
import { z } from 'zod';
import { EvaluationController } from '../controllers/EvaluationController';
import { validateRequestBody } from '../middleware/validationMiddleware';

const evaluateCandidateSchema = z.object({
  candidateId: z.string().trim().min(1),
  jobId: z.string().trim().min(1),
});

const batchEvaluateSchema = z.object({
  jobId: z.string().trim().min(1),
  candidateIds: z.array(z.string().trim().min(1)).min(1),
});

const evaluationRouter = Router();

/**
 * @openapi
 * /evaluations:
 *   post:
 *     tags: [Evaluations]
 *     summary: Evaluate a candidate for a job
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [candidateId, jobId]
 *             properties:
 *               candidateId: { type: string }
 *               jobId: { type: string }
 *     responses:
 *       201:
 *         description: Evaluation created
 *       404:
 *         description: Candidate or Job not found
 */
evaluationRouter.post('/', validateRequestBody(evaluateCandidateSchema), (req, res, next) =>
  new EvaluationController().createEvaluation(req, res, next),
);

/**
 * @openapi
 * /evaluations/job/{jobId}/rankings:
 *   get:
 *     tags: [Evaluations]
 *     summary: Get ranked candidates for a job
 *     parameters:
 *       - name: jobId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ranked list of candidates
 */
evaluationRouter.get('/job/:jobId/rankings', (req, res, next) =>
  new EvaluationController().getJobRankings(req, res, next),
);

/**
 * @openapi
 * /evaluations/batch:
 *   post:
 *     tags: [Evaluations]
 *     summary: Batch evaluate multiple candidates for a job
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobId, candidateIds]
 *             properties:
 *               jobId: { type: string }
 *               candidateIds: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Batch process results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 successful: { type: array, items: { type: object } }
 *                 failed: { type: array, items: { type: object } }
 */
evaluationRouter.post('/batch', validateRequestBody(batchEvaluateSchema), (req, res, next) =>
  new EvaluationController().createBatchEvaluation(req, res, next),
);

/**
 * @openapi
 * /evaluations/{id}/recalculate:
 *   post:
 *     tags: [Evaluations]
 *     summary: Recalculate evaluation scores using latest algorithms and weights
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Evaluation recalculated
 */
evaluationRouter.post('/:id/recalculate', (req, res, next) =>
  new EvaluationController().recalculateEvaluation(req, res, next),
);

export { evaluationRouter };
