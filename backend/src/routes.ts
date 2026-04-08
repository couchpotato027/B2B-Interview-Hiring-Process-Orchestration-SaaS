import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import candidateRoutes from './modules/candidate/candidate.routes';
import evaluationRoutes from './modules/evaluation/evaluation.routes';
import pipelineRoutes from './modules/pipeline/pipeline.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import jobRoutes from './modules/job/job.routes';
import interviewRoutes from './modules/interview/interview.routes';
import reportsRoutes from './modules/reports/reports.routes';
import auditRoutes from './modules/audit/audit.routes';

const router = Router();

router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/candidates', candidateRoutes);
router.use('/api/v1/evaluations', evaluationRoutes);
router.use('/api/v1/pipelines', pipelineRoutes);
router.use('/api/v1/dashboard', dashboardRoutes);
router.use('/api/v1/jobs', jobRoutes);
router.use('/api/v1/interviews', interviewRoutes);
router.use('/api/v1/reports', reportsRoutes);
router.use('/api/v1/audit', auditRoutes);

export default router;
