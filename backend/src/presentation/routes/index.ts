import { Router } from 'express';
import { candidateRouter } from './candidateRoutes';
import { evaluationRouter } from './evaluationRoutes';
import { healthRouter } from './health.routes';
import { jobRouter } from './jobRoutes';
import { pipelineRouter } from './pipelineRoutes';

const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/candidates', candidateRouter);
apiRouter.use('/jobs', jobRouter);
apiRouter.use('/evaluations', evaluationRouter);
apiRouter.use('/pipelines', pipelineRouter);

export { apiRouter };
