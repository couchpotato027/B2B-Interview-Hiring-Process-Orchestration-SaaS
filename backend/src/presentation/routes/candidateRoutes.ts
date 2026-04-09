import { Router } from 'express';
import { CandidateController } from '../controllers/CandidateController';
import { uploadResumeMiddleware } from '../middleware/fileUploadMiddleware';

const candidateRouter = Router();

/**
 * @openapi
 * /candidates/upload:
 *   post:
 *     tags: [Candidates]
 *     summary: Upload a candidate resume
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *               candidateEmail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Resume uploaded and processed
 */
candidateRouter.post(
  '/upload',
  uploadResumeMiddleware.single('resume'),
  (req, res, next) => new CandidateController().uploadResume(req, res, next),
);

/**
 * @openapi
 * /candidates/{id}:
 *   get:
 *     tags: [Candidates]
 *     summary: Get candidate details by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Candidate details
 *       404:
 *         description: Candidate not found
 */
candidateRouter.get('/:id', (req, res, next) =>
  new CandidateController().getCandidateById(req, res, next),
);

/**
 * @openapi
 * /candidates:
 *   get:
 *     tags: [Candidates]
 *     summary: List candidates with pagination and filters
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string }
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated list of candidates
 */
candidateRouter.get('/', (req, res, next) =>
  new CandidateController().getCandidates(req, res, next),
);

/**
 * @openapi
 * /candidates/{id}/resume-feedback:
 *   get:
 *     tags: [Candidates]
 *     summary: Generate feedback for a candidate's resume
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: AI-generated resume feedback
 */
candidateRouter.get('/:id/resume-feedback', (req, res, next) =>
  new CandidateController().getResumeFeedback(req, res, next),
);

export { candidateRouter };
