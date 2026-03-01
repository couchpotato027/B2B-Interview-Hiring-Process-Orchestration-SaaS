import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import candidateRoutes from './modules/candidate/candidate.routes';
import evaluationRoutes from './modules/evaluation/evaluation.routes';
import pipelineRoutes from './modules/pipeline/pipeline.routes';

const router = Router();

router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/candidates', candidateRoutes);
router.use('/api/v1/evaluations', evaluationRoutes);
router.use('/api/v1/pipelines', pipelineRoutes);

export default router;
