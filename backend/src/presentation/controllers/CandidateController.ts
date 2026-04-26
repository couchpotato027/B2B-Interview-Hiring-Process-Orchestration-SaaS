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
import { auditService } from '../../application/services/AuditService';
import { UploadResumeFileUseCase } from '../../application/use-cases/UploadResumeFileUseCase';

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
      const tenantId = authReq.user?.organizationId || 'default-tenant';
      const { firstName, lastName, email, pipelineId, initialStageId, jobId, resumeUrl } = req.body;

      if (!firstName || !lastName || !email || !pipelineId || !initialStageId) {
        return this.badRequest(res, 'firstName, lastName, email, pipelineId, initialStageId are required');
      }

      // Use CandidateService (module pattern) bridged via Prisma directly
      const stage = await prisma.pipelineStage.findFirst({ where: { id: initialStageId, tenantId } });
      const candidate = await prisma.candidate.create({
        data: { tenantId, pipelineId, firstName, lastName, email, currentStageId: initialStageId, jobId: jobId || null, resumeUrl: resumeUrl || null, status: 'ACTIVE' },
        include: { currentStage: true, pipeline: true, job: true },
      });

      const createdBy = authReq.user?.userId;
      wsService.emit(tenantId, 'candidate:created', { candidateId: candidate.id, name: `${candidate.firstName} ${candidate.lastName}`, jobId: candidate.jobId, createdBy });
      
      if (createdBy) {
        prisma.notification.create({
          data: { tenantId, userId: createdBy, type: 'CANDIDATE_CREATED', title: 'New Candidate', message: `${candidate.firstName} ${candidate.lastName} applied.` }
        }).catch(err => console.warn('Failed to create notification:', err.message));
      }
      
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
      const tenantId = authReq.user?.organizationId || 'default-tenant';
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
      const tenantId = authReq.user?.organizationId || 'default-tenant';
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
      const tenantId = authReq.user?.organizationId || 'default-tenant';

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

      // Row-Level Security: Interviewers only see candidates they are assigned to
      if (authReq.user?.role === 'INTERVIEWER') {
        where.interviews = {
          some: {
            panel: { some: { userId: authReq.user.userId } }
          }
        };
      }
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

      const candidates = await prisma.candidate.findMany({
        where,
        orderBy,
        include: {
          currentStage: { select: { id: true, name: true, orderIndex: true } },
          pipeline: { select: { id: true, name: true, roleType: true } },
          job: { select: { id: true, title: true } },
          assignedRecruiter: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { evaluations: true } },
        },
      });
      const total = await prisma.candidate.count({ where });

      console.log(`[CANDIDATE_LIST] Tenant: ${tenantId}, Count: ${candidates.length}, Total: ${total}`);
      
      return res.status(200).json({ 
        items: candidates, 
        total, 
        limit: candidates.length,
        offset: 0 
      });
    } catch (error) {
      console.error('[CANDIDATE_LIST_ERROR]', error);
      return next(error);
    }
  };

  /** GET /candidates/:id — Candidate detail with full relations */
  public getCandidateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant';
      const { id } = req.params;

      const candidate = await prisma.candidate.findFirst({
        where: { id, tenantId },
        include: {
          currentStage: true,
          pipeline: { include: { stages: { orderBy: { orderIndex: 'asc' } } } },
          job: { select: { id: true, title: true, department: true } },
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
      const tenantId = authReq.user?.organizationId || 'default-tenant';
      const { id } = req.params;

      const candidate = await prisma.candidate.findFirst({
        where: { id, tenantId },
        select: { createdAt: true, status: true, stageHistory: true, emailLogs: { select: { subject: true, status: true, createdAt: true } } }
      } as any);

      if (!candidate) return this.notFound(res, 'Candidate not found');

      // Construct events from creation, stage history, email logs, and current status
      const events: any[] = [
        { time: candidate.createdAt, label: 'Candidate profile created', type: 'created' }
      ];

      (candidate as any).emailLogs?.forEach((email: any) => {
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
      const tenantId = authReq.user?.organizationId || 'default-tenant';
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
      const tenantId = authReq.user?.organizationId || 'default-tenant';
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
            case 'ASSIGN_RECRUITER':
              await prisma.candidate.update({ where: { id }, data: { assignedRecruiterId: payload.recruiterId } });
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

  private get uploadResumeFileUseCase() {
    return Container.getInstance().resolve<UploadResumeFileUseCase>('UploadResumeFileUseCase');
  }

  public uploadResume = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new ValidationError('Resume file is required.');
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || 'default-tenant';
      const userId = authReq.user?.userId || 'system-orchestrator';

      // 1. First upload the file to get a valid URL
      console.log('☁️ [Upload] Sending to storage...', req.file.originalname);
      const uploadResult = await this.uploadResumeFileUseCase.execute({
        file: req.file.buffer,
        fileName: req.file.originalname,
        uploadedBy: userId,
        organizationId
      });

      if (!uploadResult.success) {
        console.error('❌ [Upload] Storage failed:', uploadResult.error);
        return this.serverError(res, { message: String(uploadResult.error), code: uploadResult.code });
      }
      console.log('✅ [Upload] Storage complete:', uploadResult.data.url);

      // 2. Process/Parse the resume
      const result = await this.processResumeUseCase.execute({
        file: req.file.buffer,
        fileName: req.file.originalname,
        organizationId,
        resumeUrl: uploadResult.data.url,
        jobId: typeof req.body.jobId === 'string' ? req.body.jobId : undefined,
      });

      if (!result.success) {
        console.error('❌ [Upload] Resume processing failed:', result.error, 'Code:', result.code);
        if (result.code === 'MISSING_CANDIDATE_EMAIL' || result.code === 'INVALID_FILE_FORMAT') return this.badRequest(res, String(result.error), result.code);
        return this.serverError(res, { message: String(result.error), code: result.code });
      }

      const dto = CandidateTransformer.toDetailedDTO({ candidate: result.data, resume: null, evaluations: [] });
      const createdBy = authReq.user?.userId;

      // Audit Log
      await auditService.log({
        tenantId: organizationId,
        userId: createdBy,
        action: 'CREATE',
        resource: 'Candidate',
        resourceId: dto.candidate.id,
        changes: { source: 'RESUME_UPLOAD', fileName: req.file.originalname },
        ipAddress: req.ip
      });

      wsService.emit(organizationId, 'candidate:created', { candidateId: dto.candidate.id, name: `${dto.candidate.firstName} ${dto.candidate.lastName}`, jobId: (dto.candidate as any).jobId, createdBy });
      
      if (createdBy) {
        prisma.notification.create({
          data: { tenantId: organizationId, userId: createdBy, type: 'CANDIDATE_CREATED', title: 'New Candidate', message: `${dto.candidate.firstName} ${dto.candidate.lastName} resume parsed.` }
        }).catch(err => console.warn('Failed to create notification:', err.message));
      }
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
      const organizationId = authReq.user?.organizationId || 'default-tenant';
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

      const movedBy = authReq.user?.userId;

      // Audit Log
      await auditService.log({
        tenantId: organizationId,
        userId: movedBy,
        action: 'STAGE_TRANSITION',
        resource: 'Candidate',
        resourceId: id,
        changes: { 
          fromStage: (candidate as any).currentStageId, 
          toStage: newStageId,
          reason: req.body.reason 
        },
        ipAddress: req.ip
      });

      wsService.emit(organizationId, 'candidate:moved', { candidateId: id, fromStage: (candidate as any).currentStageId || 'unknown', toStage: newStageId, movedBy });
      
      if (movedBy) {
        prisma.notification.create({
          data: { tenantId: organizationId, userId: movedBy, type: 'STAGE_MOVED', title: 'Stage Updated', message: `Candidate was moved to a new stage.` }
        }).catch(err => console.warn('Failed to create move notification:', err.message));
      }

      return this.rawOk(res, result);
    } catch (error) {
      return next(error);
    }
  };

  public reject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant';
      const { id } = req.params;
      const { reason } = req.body || {};

      // 1. Find candidate with tenant validation
      const candidate = await prisma.candidate.findFirst({
        where: { id, tenantId },
        include: { job: { select: { title: true } } },
      });
      if (!candidate) return this.notFound(res, 'Candidate not found');

      // 2. Guard: don't reject if already rejected or hired
      if (candidate.status === 'REJECTED') {
        return this.badRequest(res, 'Candidate is already rejected.');
      }
      if (candidate.status === 'HIRED') {
        return this.badRequest(res, 'Cannot reject a hired candidate. Revoke the offer first.');
      }

      // 3. Update status 
      const updated = await prisma.candidate.update({
        where: { id },
        data: {
          status: 'REJECTED',
          stageHistory: {
            ...(Array.isArray(candidate.stageHistory) ? candidate.stageHistory : []),
            push: { action: 'REJECTED', reason: reason || 'No reason provided', at: new Date().toISOString(), by: authReq.user?.email || 'system' },
          } as any,
        },
        include: { currentStage: true },
      });

      // 4. Send rejection notification email
      addEmailToQueue({
        tenantId,
        candidateId: id,
        to: candidate.email,
        subject: `Update on your application${candidate.job?.title ? ` for ${candidate.job.title}` : ''}`,
        body: `Hi ${candidate.firstName},<br><br>Thank you for your interest and the time you invested in our selection process. After careful consideration, we have decided to move forward with other candidates at this time.<br><br>${reason ? `Feedback: ${reason}<br><br>` : ''}We wish you the best in your future endeavors.`,
      }).catch(err => console.error('Failed to queue rejection email:', err));

      // 5. Emit real-time event
      wsService.emit(tenantId, 'candidate:rejected', {
        candidateId: id,
        name: `${candidate.firstName} ${candidate.lastName}`,
        rejectedBy: authReq.user?.email,
      });

      // Audit Log
      await auditService.log({
        tenantId,
        userId: authReq.user?.userId,
        action: 'UPDATE',
        resource: 'Candidate',
        resourceId: id,
        changes: { status: { old: candidate.status, new: 'REJECTED' }, reason },
        ipAddress: req.ip
      });

      // 6. Create notification for the recruiter (non-blocking — don't crash the operation)
      if (authReq.user?.userId) {
        prisma.notification.create({
          data: { tenantId, userId: authReq.user.userId, type: 'CANDIDATE_REJECTED', title: 'Candidate Rejected', message: `${candidate.firstName} ${candidate.lastName} was rejected.${reason ? ` Reason: ${reason}` : ''}` }
        }).catch(err => console.warn('Failed to create reject notification:', err.message));
      }

      return this.rawOk(res, { success: true, status: 'REJECTED', candidateId: id });
    } catch (error) { return next(error); }
  };

  public hire = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant';
      const { id } = req.params;

      // 1. Find candidate with tenant validation
      const candidate = await prisma.candidate.findFirst({
        where: { id, tenantId },
        include: { job: { select: { title: true } } },
      });
      if (!candidate) return this.notFound(res, 'Candidate not found');

      // 2. Guard: don't hire if already hired or rejected
      if (candidate.status === 'HIRED') {
        return this.badRequest(res, 'Candidate is already hired.');
      }
      if (candidate.status === 'REJECTED') {
        return this.badRequest(res, 'Cannot hire a rejected candidate. Reactivate them first.');
      }

      // 3. Update status
      const updated = await prisma.candidate.update({
        where: { id },
        data: {
          status: 'HIRED',
          stageHistory: {
            ...(Array.isArray(candidate.stageHistory) ? candidate.stageHistory : []),
            push: { action: 'HIRED', at: new Date().toISOString(), by: authReq.user?.email || 'system' },
          } as any,
        },
        include: { currentStage: true },
      });

      // 4. Send offer/congratulations email
      addEmailToQueue({
        tenantId,
        candidateId: id,
        to: candidate.email,
        subject: `Congratulations! Offer for ${candidate.job?.title || 'the position'}`,
        body: `Hi ${candidate.firstName},<br><br>We are pleased to extend an offer for the ${candidate.job?.title || 'position'}. Our team was impressed with your skills and experience during the interview process.<br><br>We will be in touch shortly with the details of your offer package.`,
      }).catch(err => console.error('Failed to queue offer email:', err));

      // 5. Emit real-time event
      wsService.emit(tenantId, 'candidate:hired', {
        candidateId: id,
        name: `${candidate.firstName} ${candidate.lastName}`,
        hiredBy: authReq.user?.email,
      });

      // 6. Create notification (non-blocking — don't crash the operation)
      if (authReq.user?.userId) {
        prisma.notification.create({
          data: { tenantId, userId: authReq.user.userId, type: 'CANDIDATE_HIRED', title: 'Candidate Hired', message: `${candidate.firstName} ${candidate.lastName} has been hired!` }
        }).catch(err => console.warn('Failed to create hire notification:', err.message));
      }

      return this.rawOk(res, { success: true, status: 'HIRED', candidateId: id });
    } catch (error) { return next(error); }
  };

  public getResumeFeedback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || 'default-tenant';
      const result = await this.resumeFeedbackUseCase.execute({ candidateId: req.params.id as string, organizationId });
      if (!result.success) {
        if (result.code === 'CANDIDATE_NOT_FOUND' || result.code === 'RESUME_NOT_FOUND') return this.notFound(res, result.error as string, result.code);
        return this.serverError(res, { message: result.error as string, code: result.code });
      }
      return this.rawOk(res, result.data);
    } catch (error) {
      return next(error);
    }
  };

  /** PATCH /candidates/:id/assign — Assign a recruiter */
  public assignRecruiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant';
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) return this.badRequest(res, 'userId is required');

      const idStr = id as string;
      const tenantIdStr = tenantId as string;
      const candidate = await this.candidateRepository.findById(idStr, tenantIdStr);
      if (!candidate) return this.notFound(res, 'Candidate not found');

      const oldRecruiterId = candidate.getAssignedRecruiterId();
      candidate.setAssignedRecruiterId(userId);
      const updatedCandidate = await this.candidateRepository.update(idStr, candidate, tenantIdStr);

      // Notify the recruiter
      prisma.notification.create({
        data: { 
          tenantId: tenantIdStr, 
          userId, 
          type: 'TASK_ASSIGNED', 
          title: 'Candidate Assigned', 
          message: `You have been assigned as the lead recruiter for ${candidate.getName()}.` 
        }
      }).catch(() => {});

      // Audit Log
      await auditService.log({
        tenantId: tenantIdStr,
        userId: authReq.user?.userId,
        action: 'UPDATE',
        resource: 'Candidate',
        resourceId: idStr,
        changes: { 
          assignedRecruiterId: { 
            old: oldRecruiterId, 
            new: userId 
          } 
        },
        ipAddress: req.ip
      });

      wsService.emit(tenantIdStr, 'candidate:updated', { id: idStr, assignedRecruiterId: userId });

      return this.ok(res, CandidateTransformer.toDTO(updatedCandidate));
    } catch (error) {
      return next(error);
    }
  };
}
