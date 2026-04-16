import { Router } from 'express';
import { CandidateController } from '../controllers/CandidateController';
import { uploadResumeMiddleware } from '../middleware/fileUploadMiddleware';

const candidateRouter = Router();
const ctrl = () => new CandidateController();

// ─── Resume Upload ──────────────────────────────────────────────────────────
candidateRouter.post('/upload', uploadResumeMiddleware.single('resume'), (req, res, next) => ctrl().uploadResume(req, res, next));

// ─── Bulk Actions ───────────────────────────────────────────────────────────
candidateRouter.post('/bulk-update', (req, res, next) => ctrl().bulkUpdate(req, res, next));

// ─── Collection Routes ──────────────────────────────────────────────────────
/**
 * GET /candidates?search=alice&status=ACTIVE&stage=<id>&sort=name&order=asc&dateRange=30d
 */
candidateRouter.get('/', (req, res, next) => ctrl().getCandidates(req, res, next));

/**
 * POST /candidates — Create candidate directly
 * body: { firstName, lastName, email, pipelineId, initialStageId, jobId?, resumeUrl? }
 */
candidateRouter.post('/', (req, res, next) => ctrl().createCandidate(req, res, next));

// ─── Per-Candidate Routes ───────────────────────────────────────────────────
candidateRouter.get('/:id', (req, res, next) => ctrl().getCandidateById(req, res, next));
candidateRouter.put('/:id', (req, res, next) => ctrl().updateCandidate(req, res, next));
candidateRouter.delete('/:id', (req, res, next) => ctrl().deleteCandidate(req, res, next));

// Feedback
candidateRouter.get('/:id/resume-feedback', (req, res, next) => ctrl().getResumeFeedback(req, res, next));

// Stage transitions
candidateRouter.post('/:id/transition', (req, res, next) => ctrl().moveStage(req, res, next));
candidateRouter.put('/:id/stage', (req, res, next) => ctrl().moveStage(req, res, next));
candidateRouter.post('/:id/reject', (req, res, next) => ctrl().reject(req, res, next));
candidateRouter.post('/:id/hire', (req, res, next) => ctrl().hire(req, res, next));

export { candidateRouter };
