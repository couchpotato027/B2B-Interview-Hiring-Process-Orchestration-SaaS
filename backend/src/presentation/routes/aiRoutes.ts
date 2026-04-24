import { Router } from 'express';
import { parseResume, matchJob, detectDuplicates } from '../controllers/AIController';

const aiRouter = Router();

// /api/v1/ai
aiRouter.post('/parse-resume', parseResume);
aiRouter.post('/match-job', matchJob);
aiRouter.post('/detect-duplicates', detectDuplicates);

export { aiRouter };
