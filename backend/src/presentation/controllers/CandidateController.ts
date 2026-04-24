import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { Container } from '../../infrastructure/di/Container';
import { GetCandidateDetailsUseCase } from '../../application/use-cases/GetCandidateDetailsUseCase';
import { ProcessResumeUseCase } from '../../application/use-cases/ProcessResumeUseCase';
import { ResumeFeedbackUseCase } from '../../application/use-cases/ResumeFeedbackUseCase';
import { MoveCandidateThroughPipelineUseCase } from '../../application/use-cases/MoveCandidateThroughPipelineUseCase';
import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { ValidationError } from '../../shared/errors/ValidationError';
import { CandidateTransformer } from '../transformers/CandidateTransformer';
import { wsService } from '../integration/websocket';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';
import { prisma } from '../../infrastructure/database/prisma.client';
import { addEmailToQueue } from '../../infrastructure/queues/EmailQueue';

export class CandidateController extends BaseController {
  private get processResumeUseCase() {
    return Container.getInstance().resolve<ProcessResumeUseCase>('ProcessResumeUseCase');
  }
  private get getCandidateDetailsUseCase() {
    return Container.getInstance().resolve<GetCandidateDetailsUseCase>('GetCandidateDetailsUseCase');
  }
  private get resumeFeedbackUseCase() {
    return Container.getInstance().resolve<ResumeFeedbackUseCase>('ResumeFeedbackUseCase');
  }
  private get candidateRepository() {
    return Container.getInstance().resolve<ICandidateRepository>('CandidateRepository');
  }
  private get moveCandidateUseCase() {
    return Container.getInstance().resolve<MoveCandidateThroughPipelineUseCase>('MoveCandidateThroughPipelineUseCase');
  }

  constructor() {
    super();
  }

  /** POST /candidates — Create a new candidate directly */
  public createCandidate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant-id';
      const { firstName, lastName, email, pipelineId, initialStageId, jobId, resumeUrl } = req.body;

      if (!firstName || !lastName || !email || !pipelineId || !initialStageId) {
        return this.badRequest(res, 'firstName, lastName, email, pipelineId, initialStageId are required');
      }

      // Use CandidateService (module pattern) bridged via Prisma directly
      const stage = await prisma.pipelineStage.findFirst({ where: { id: initialStageId, tenantId } });
      const candidate = await prisma.candidate.create({
        data: { tenantId, pipelineId, firstName, lastName, email, currentStageId: initialStageId, jobId: jobId || null, resumeUrl: resumeUrl || null, status: 'ACTIVE' },
        include: { currentStage: true, pipeline: true },
      });

      wsService.emit(tenantId, 'CANDIDATE_ADDED', candidate);
      
      // Auto-send application received email
      addEmailToQueue({
        tenantId,
        candidateId: candidate.id,
        to: candidate.email,
        subject: `We received your application for ${candidate.job?.title || 'the position'}`,
        body: `Hi ${candidate.firstName},<br><br>Thank you for applying for the ${candidate.job?.title || 'position'}. We have received your application and will review it shortly.`,
      }).catch(err => console.error('Failed to queue welcome email:', err));

      return this.created(res, candidate);
    } catch (error: any) {
      if (error?.code === 'P2002') return this.badRequest(res, 'A candidate with this email already exists.');
      return next(error);
    }
  };

  /** PUT /candidates/:id — Update candidate fields */
  public updateCandidate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant-id';
      const { id } = req.params;
      const { firstName, lastName, email, resumeUrl } = req.body;

      const candidate = await prisma.candidate.findFirst({ where: { id, tenantId } });
      if (!candidate) return this.notFound(res, 'Candidate not found');

      const updated = await prisma.candidate.update({
        where: { id },
        data: { ...(firstName && { firstName }), ...(lastName && { lastName }), ...(email && { email }), ...(resumeUrl && { resumeUrl }) },
        include: { currentStage: true, pipeline: true },
      });

      return this.rawOk(res, updated);
    } catch (error) {
      return next(error);
    }
  };

  /** DELETE /candidates/:id */
  public deleteCandidate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant-id';
      const { id } = req.params;

      const candidate = await prisma.candidate.findFirst({ where: { id, tenantId } });
      if (!candidate) return this.notFound(res, 'Candidate not found');

      await prisma.candidate.delete({ where: { id } });
      return this.rawOk(res, { success: true });
    } catch (error) {
      return next(error);
    }
  };

  /** GET /candidates — List with rich filtering, search, sort */
  public getCandidates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant-id';

      const search = (req.query.search as string) || (req.query.q as string) || '';
      const status = req.query.status as string;
      const stageId = req.query.stage as string;
      const sort = (req.query.sort as string) || 'createdAt';
      const order = (req.query.order as string) === 'asc' ? 'asc' : 'desc';
      const dateRange = req.query.dateRange as string;

      // Date range filter
      let createdAtFilter: any = undefined;
      if (dateRange === '7d') createdAtFilter = { gte: new Date(Date.now() - 7 * 86400000) };
      else if (dateRange === '30d') createdAtFilter = { gte: new Date(Date.now() - 30 * 86400000) };
      else if (dateRange === '90d') createdAtFilter = { gte: new Date(Date.now() - 90 * 86400000) };

      // Build where clause
      const where: any = { tenantId };
      if (status) where.status = status;
      if (stageId) where.currentStageId = stageId;
      if (createdAtFilter) where.createdAt = createdAtFilter;
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Validate sort field against allowed columns
      const allowedSorts: Record<string, any> = {
        createdAt: { createdAt: order },
        name: [{ firstName: order }, { lastName: order }],
        email: { email: order },
        status: { status: order },
      };
      const orderBy = allowedSorts[sort] || { createdAt: 'desc' };

      const [candidates, total] = await Promise.all([
        prisma.candidate.findMany({
          where,
          orderBy,
          include: {
            currentStage: { select: { id: true, name: true, orderIndex: true } },
            pipeline: { select: { id: true, name: true, roleType: true } },
            job: { select: { id: true, title: true } },
            _count: { select: { evaluations: true } },
          },
        }),
        prisma.candidate.count({ where }),
      ]);

      return res.status(200).json({ items: candidates, total, filtered: candidates.length });
    } catch (error) {
      return next(error);
    }
  };

  /** GET /candidates/:id — Candidate detail with full relations */
  public getCandidateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant-id';
      const { id } = req.params;

      const candidate = await prisma.candidate.findFirst({
        where: { id, tenantId },
        include: {
          currentStage: true,
          pipeline: { include: { stages: { orderBy: { orderIndex: 'asc' } } } },
          job: { select: { id: true, title: true, department: true } },
          evaluations: {
            include: {
              interviewer: { select: { firstName: true, lastName: true, email: true } },
              stage: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          interviews: {
            include: {
              interviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
              stage: { select: { name: true } },
            },
            orderBy: { scheduledAt: 'desc' },
          },
          slaAlerts: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      });

      if (!candidate) return this.notFound(res, 'Candidate not found');
      return this.rawOk(res, candidate);
    } catch (error) {
      return next(error);
    }
  };

  /** GET /candidates/:id/timeline — Candidate activity history */
  public getTimeline = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant-id';
      const { id } = req.params;

      const candidate = await prisma.candidate.findFirst({
        where: { id, tenantId },
        select: { createdAt: true, status: true, stageHistory: true, emailLogs: { select: { subject: true, status: true, createdAt: true } } }
      });

      if (!candidate) return this.notFound(res, 'Candidate not found');

      // Construct events from creation, stage history, email logs, and current status
      const events: any[] = [
        { time: candidate.createdAt, label: 'Candidate profile created', type: 'created' }
      ];

      candidate.emailLogs.forEach(email => {
        events.push({
          time: email.createdAt,
          label: `Email Sent: ${email.subject} (${email.status})`,
          type: 'email'
        });
      });

      if (Array.isArray(candidate.stageHistory)) {
        (candidate.stageHistory as any[]).forEach(h => {
          events.push({
            time: h.enteredAt || h.movedAt || new Date(),
            label: h.stageName ? `Moved to ${h.stageName}` : 'Stage transition',
            type: 'stage'
          });
        });
      }

      if (candidate.status !== 'ACTIVE') {
        events.push({
          time: new Date(),
          label: `Status changed to ${candidate.status}`,
          type: 'status'
        });
      }

      // Add actual audits if any
      const audits = await prisma.auditLog.findMany({
        where: { tenantId, resource: 'Candidate', resourceId: id } as any,
        orderBy: { createdAt: 'desc' }
      });

      audits.forEach(a => {
        events.push({
          time: a.createdAt,
          label: a.action === 'CREATE' ? 'Candidate created' : `${a.action} action performed`,
          type: 'audit'
        });
      });

      return this.rawOk(res, events.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
    } catch (error) {
      return next(error);
    }
  };

  /** GET /candidates/:id/interviews — Candidate interview rounds */
  public getInterviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant-id';
      const { id } = req.params;

      const interviews = await prisma.interview.findMany({
        where: { candidateId: id, tenantId },
        include: {
          interviewer: { select: { firstName: true, lastName: true, email: true } },
          stage: { select: { name: true } }
        },
        orderBy: { scheduledAt: 'desc' }
      });

      return this.rawOk(res, interviews);
    } catch (error) {
      return next(error);
    }
  };

  /** POST /candidates/bulk-update — Bulk actions */
  public bulkUpdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant-id';
      const { candidateIds, action, payload } = req.body;

      if (!candidateIds?.length || !action) return this.badRequest(res, 'candidateIds and action required');

      const results = { total: candidateIds.length, success: 0, failed: 0, errors: [] as any[] };

      for (const id of candidateIds) {
        try {
          switch (action) {
            case 'MOVE_STAGE':
              await prisma.candidate.update({ where: { id }, data: { currentStageId: payload.newStageId } });
              break;
            case 'REJECT':
              await prisma.candidate.update({ where: { id }, data: { status: 'REJECTED' } });
              break;
            case 'HIRE':
              await prisma.candidate.update({ where: { id }, data: { status: 'HIRED' } });
              break;
            case 'DELETE':
              await prisma.candidate.deleteMany({ where: { id, tenantId } });
              break;
            default:
              throw new Error(`Invalid action: ${action}`);
          }
          results.success++;
        } catch (err: any) {
          results.failed++;
          results.errors.push({ id, error: err.message });
        }
      }

      return this.rawOk(res, results);
    } catch (error) {
      return next(error);
    }
  };

  public uploadResume = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new ValidationError('Resume file is required.');
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || 'default-tenant-id';
      const result = await this.processResumeUseCase.execute({
        file: req.file.buffer,
        fileName: req.file.originalname,
        organizationId,
        candidateEmail: typeof req.body.candidateEmail === 'string' ? req.body.candidateEmail : undefined,
      });
      if (!result.success) {
        if (result.code === 'MISSING_CANDIDATE_EMAIL' || result.code === 'INVALID_FILE_FORMAT') return this.badRequest(res, String(result.error), result.code);
        return this.serverError(res, { message: String(result.error), code: result.code });
      }
      const dto = CandidateTransformer.toDetailedDTO(result.data);
      wsService.emit(organizationId, 'CANDIDATE_ADDED', dto);
      return this.rawOk(res, dto);
    } catch (error) {
      return next(error);
    }
  };

  public moveStage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const newStageId = req.body.newStageId as string;
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || 'default-tenant-id';
      const candidate = await this.candidateRepository.findById(id, organizationId);
      if (!candidate) return this.notFound(res, 'Candidate not found.', 'CANDIDATE_NOT_FOUND');
      const result = await this.moveCandidateUseCase.execute({
        candidateId: id,
        pipelineId: candidate.getPipelineId(),
        newStageId,
        organizationId,
        movedBy: authReq.user?.userId || 'admin@hireflow.com',
        reason: req.body.reason,
      });
      return this.rawOk(res, result);
    } catch (error) {
      return next(error);
    }
  };

  public reject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant-id';
      await prisma.candidate.update({ where: { id: req.params.id }, data: { status: 'REJECTED' } });
      return this.rawOk(res, { success: true });
    } catch (error) { return next(error); }
  };

  public hire = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.candidate.update({ where: { id: req.params.id }, data: { status: 'HIRED' } });
      return this.rawOk(res, { success: true });
    } catch (error) { return next(error); }
  };

  public getResumeFeedback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || 'default-tenant-id';
      const result = await this.resumeFeedbackUseCase.execute({ candidateId: req.params.id as string, organizationId });
      if (!result.success) {
        if (result.code === 'CANDIDATE_NOT_FOUND' || result.code === 'RESUME_NOT_FOUND') return this.notFound(res, result.error as string, result.code);
        return this.serverError(res, { message: result.error as string, code: result.code });
      }
      return this.rawOk(res, result.data);
    } catch (error) { return next(error); }
  };
}
