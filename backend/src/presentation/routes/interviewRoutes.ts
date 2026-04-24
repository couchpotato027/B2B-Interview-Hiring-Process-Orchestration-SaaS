import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.client';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';
import { wsService } from '../integration/websocket';

const interviewRouter = Router();

const getTenantId = (req: Request) =>
  (req as unknown as AuthenticatedRequest).user?.organizationId || 'default-tenant-id';

/**
 * GET /interviews?candidateId=&interviewerId=
 */
interviewRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { candidateId, interviewerId } = req.query;

    const where: any = { tenantId };
    if (candidateId) where.candidateId = candidateId as string;
    if (interviewerId) where.interviewerId = interviewerId as string;

    const interviews = await prisma.interview.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
        interviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
        stage: { select: { name: true } },
      },
    });

    return res.status(200).json(interviews);
  } catch (err) { return next(err); }
});

/**
 * POST /interviews — Schedule a new interview
 * body: { candidateId, interviewerId, stageId, scheduledAt, notes }
 */
interviewRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { candidateId, interviewerId, stageId, scheduledAt, notes } = req.body;

    if (!candidateId || !interviewerId || !scheduledAt || !stageId) {
      return res.status(400).json({ message: 'candidateId, interviewerId, stageId, scheduledAt are required' });
    }

    const interview = await prisma.interview.create({
      data: {
        tenantId,
        candidateId,
        interviewerId,
        stageId,
        scheduledAt: new Date(scheduledAt),
        notes: notes || null,
        feedbackStatus: 'PENDING',
      },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
        interviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
        stage: { select: { name: true } },
      },
    });

      const interviewerName = interview.interviewer?.firstName || 'Interviewer';
      wsService.emit(tenantId, 'interview:scheduled', { candidateId, interviewerId, scheduledAt: interview.scheduledAt });
      
      await prisma.notification.create({
        data: {
          tenantId,
          userId: interviewerId,
          type: 'INTERVIEW_SCHEDULED',
          title: 'Interview Scheduled',
          message: `You have an interview scheduled with candidate ${interview.candidate?.firstName || ''} on ${new Date(scheduledAt).toLocaleDateString()}`
        }
      });

      return res.status(201).json(interview);
  } catch (err) { return next(err); }
});

/**
 * PUT /interviews/:id — Update interview (reschedule / add notes)
 */
interviewRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { scheduledAt, notes, feedbackStatus } = req.body;

    const updated = await prisma.interview.update({
      where: { id },
      data: {
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(notes !== undefined && { notes }),
        ...(feedbackStatus && { feedbackStatus }),
      },
    });

    return res.status(200).json(updated);
  } catch (err) { return next(err); }
});

/**
 * POST /interviews/:id/feedback — Mark interview as completed with feedback
 * body: { notes, feedbackStatus }
 */
interviewRouter.post('/:id/feedback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const updated = await prisma.interview.update({
      where: { id },
      data: {
        feedbackStatus: 'SUBMITTED',
        notes: notes || undefined,
      },
    });

    return res.status(200).json(updated);
  } catch (err) { return next(err); }
});

export { interviewRouter };
