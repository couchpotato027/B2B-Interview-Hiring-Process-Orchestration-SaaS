import { Router } from 'express';
import { candidateRouter } from './candidateRoutes';
import { evaluationRouter } from './evaluationRoutes';
import { healthRouter } from './health.routes';
import { jobRouter } from './jobRoutes';
import { pipelineRouter } from './pipelineRoutes';
import { analyticsRouter } from './analyticsRoutes';
import { identityRouter } from './identityRoutes';
import { fileRouter } from './fileRoutes';
import { searchRouter } from './searchRoutes';
import { interviewRouter } from './interviewRoutes';
import { complianceRouter } from './complianceRoutes';
import { auditRouter } from './auditRoutes';
import { emailRouter } from './emailRoutes';
import { notificationRouter } from './notificationRoutes';
import { exchangeRouter } from './exchangeRoutes';
import { aiRouter } from './aiRoutes';
import { publicApiRouter, webhookRouter } from './integrationRoutes';
import { authMiddleware } from '../../infrastructure/middleware/AuthMiddleware';
import { auditMiddleware } from '../../infrastructure/middleware/AuditMiddleware';

const apiRouter = Router();

// Public routes
apiRouter.use(healthRouter);
apiRouter.use('/auth', identityRouter);

// Protected routes
apiRouter.use(authMiddleware);
apiRouter.use(auditMiddleware);

apiRouter.use('/candidates', candidateRouter);
apiRouter.use('/jobs', jobRouter);
apiRouter.use('/evaluations', evaluationRouter);
apiRouter.use('/pipelines', pipelineRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/reports', analyticsRouter);
apiRouter.use('/dashboard', analyticsRouter);
apiRouter.use('/files', fileRouter);
apiRouter.use('/search', searchRouter);
apiRouter.use('/interviews', interviewRouter);
apiRouter.use('/audit', auditRouter);
apiRouter.use('/compliance', complianceRouter);
apiRouter.use('/emails', emailRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/exchange', exchangeRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/public', publicApiRouter);
apiRouter.use('/webhooks', webhookRouter);

export { apiRouter };
