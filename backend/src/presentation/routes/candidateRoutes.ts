import { Router } from 'express';
import { CandidateController } from '../controllers/CandidateController';
import { uploadResumeMiddleware } from '../middleware/fileUploadMiddleware';

const candidateRouter = Router();

candidateRouter.post(
  '/upload',
  uploadResumeMiddleware.single('resume'),
  (req, res, next) => new CandidateController().uploadResume(req, res, next),
);
candidateRouter.get('/:id', (req, res, next) =>
  new CandidateController().getCandidateById(req, res, next),
);
candidateRouter.get('/', (req, res, next) =>
  new CandidateController().getCandidates(req, res, next),
);

export { candidateRouter };
