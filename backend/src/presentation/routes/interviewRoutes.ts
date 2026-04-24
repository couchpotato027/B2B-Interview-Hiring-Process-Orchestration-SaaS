import { Router } from 'express';
import { z } from 'zod';
import { InterviewController } from '../controllers/InterviewController';
import { validateRequestBody } from '../middleware/validationMiddleware';

const scheduleInterviewSchema = z.object({
  candidateId: z.string().uuid(),
  stageId: z.string().uuid(),
  title: z.string().min(1),
  type: z.enum(['phone', 'video', 'onsite', 'technical']),
  scheduledAt: z.string().datetime(),
  duration: z.number().positive(),
  notes: z.string().optional(),
  panel: z.array(z.object({
    userId: z.string().uuid(),
    role: z.enum(['lead', 'shadow', 'observer'])
  })).min(1)
});

const feedbackSchema = z.object({
    feedback: z.object({
        rating: z.number().min(1).max(5),
        recommendation: z.enum(['strong_hire', 'hire', 'maybe', 'no_hire', 'strong_no_hire']),
        notes: z.string().min(1),
        strengths: z.array(z.string()).default([]),
        weaknesses: z.array(z.string()).default([]),
        rubricResponses: z.record(z.any()).optional()
    })
});

const interviewRouter = Router();
const controller = new InterviewController();

/**
 * @openapi
 * /interviews/schedule:
 *   post:
 *     tags: [Interviews]
 *     summary: Schedule a new interview (panel support, calendar integration)
 */
interviewRouter.post('/schedule', validateRequestBody(scheduleInterviewSchema), controller.schedule);

/**
 * @openapi
 * /interviews/{id}/feedback:
 *   post:
 *     tags: [Interviews]
 *     summary: Submit detailed interview feedback
 */
interviewRouter.post('/:id/feedback', validateRequestBody(feedbackSchema), controller.submitFeedback);

/**
 * @openapi
 * /interviews/candidate/{candidateId}:
 *   get:
 *     tags: [Interviews]
 *     summary: Get all interviews for a specific candidate
 */
interviewRouter.get('/candidate/:candidateId', controller.getCandidateInterviews);

/**
 * @openapi
 * /interviews/availability:
 *   get:
 *     tags: [Interviews]
 *     summary: Check interviewer availability
 */
interviewRouter.get('/availability', controller.getAvailability);

export { interviewRouter };
