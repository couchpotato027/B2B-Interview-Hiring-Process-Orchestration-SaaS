import { Router } from 'express';
import { z } from 'zod';
import { EvaluationController } from '../controllers/EvaluationController';
import { validateRequestBody } from '../middleware/validationMiddleware';

const evaluateCandidateSchema = z.object({
  candidateId: z.string().trim().min(1),
  jobId: z.string().trim().min(1),
});

const evaluationRouter = Router();

evaluationRouter.post('/', validateRequestBody(evaluateCandidateSchema), (req, res, next) =>
  new EvaluationController().createEvaluation(req, res, next),
);
evaluationRouter.get('/job/:jobId/rankings', (req, res, next) =>
  new EvaluationController().getJobRankings(req, res, next),
);

export { evaluationRouter };
