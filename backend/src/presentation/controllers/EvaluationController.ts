import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { Container } from '../../infrastructure/di/Container';
import { EvaluateCandidateUseCase } from '../../application/use-cases/EvaluateCandidateUseCase';
import { RankCandidatesForJobUseCase } from '../../application/use-cases/RankCandidatesForJobUseCase';
import { BatchEvaluationUseCase } from '../../application/use-cases/BatchEvaluationUseCase';
import { EvaluationTransformer } from '../transformers/EvaluationTransformer';
import { wsService } from '../integration/websocket';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';
import { prisma } from '../../infrastructure/database/prisma.client';

export class EvaluationController extends BaseController {
  private get evaluateCandidateUseCase() {
    return Container.getInstance().resolve<EvaluateCandidateUseCase>('EvaluateCandidateUseCase');
  }
  private get rankCandidatesForJobUseCase() {
    return Container.getInstance().resolve<RankCandidatesForJobUseCase>('RankCandidatesForJobUseCase');
  }
  private get batchEvaluationUseCase() {
    return Container.getInstance().resolve<BatchEvaluationUseCase>('BatchEvaluationUseCase');
  }

  constructor() {
    super();
  }

  public createEvaluation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);

      if (!organizationId) {
        return this.badRequest(res, 'Organization ID is required.', 'MISSING_ORGANIZATION_ID');
      }

      const result = await this.evaluateCandidateUseCase.execute({
        ...req.body,
        organizationId
      });

      if (!result.success) {
        const isNotFound = result.code === 'CANDIDATE_NOT_FOUND' || result.code === 'JOB_NOT_FOUND';
        if (isNotFound) {
          return this.notFound(res, result.error as string, result.code);
        }

        return this.serverError(res, { message: result.error as string, code: result.code });
      }

      const dto = EvaluationTransformer.toDTO(result.data);
      
      // Emit real-time events
      const evaluatedBy = authReq.user?.userId;
      wsService.emit(organizationId, 'candidate:evaluated', { candidateId: dto.candidateId, jobId: dto.jobId, score: (dto as any).score || 0, evaluatedBy });
      wsService.emit(organizationId, 'RANKINGS_UPDATED', { jobId: dto.jobId });

      if (evaluatedBy) {
        await prisma.notification.create({
          data: { tenantId: organizationId, userId: evaluatedBy, type: 'CANDIDATE_EVALUATED', title: 'Evaluation Submitted', message: `Evaluation for candidate completed.` }
        });
      }

      return this.created(res, dto);
    } catch (error) {
      return next(error);
    }
  };

  public getJobRankings = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);

      if (!organizationId) {
        return this.badRequest(res, 'Organization ID is required.', 'MISSING_ORGANIZATION_ID');
      }

      const result = await this.rankCandidatesForJobUseCase.execute({
        jobId: req.params.jobId as string,
        organizationId
      });

      if (!result.success) {
        const isNotFound = result.code === 'JOB_NOT_FOUND';
        if (isNotFound) {
          return this.notFound(res, result.error as string, result.code);
        }

        return this.badRequest(res, result.error as string, result.code);
      }

      return this.ok(res, result.data);
    } catch (error) {
      return next(error);
    }
  };

  public createBatchEvaluation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);

      if (!organizationId) {
        return this.badRequest(res, 'Organization ID is required.', 'MISSING_ORGANIZATION_ID');
      }

      const result = await this.batchEvaluationUseCase.execute({
        ...req.body,
        organizationId
      });

      if (!result.success) {
        return this.serverError(res, { message: result.error as string, code: result.code });
      }

      // Transform successful evaluations
      const transformedSuccessful = result.data.successful.map((e: any) =>
        EvaluationTransformer.toDTO(e),
      );

      const evaluatedBy = authReq.user?.userId;
      
      // Emit real-time events for each successful evaluation
      for (const dto of transformedSuccessful) {
        wsService.emit(organizationId, 'candidate:evaluated', { candidateId: dto.candidateId, jobId: dto.jobId, score: (dto as any).score || 0, evaluatedBy });
      }

      if (transformedSuccessful.length > 0 && evaluatedBy) {
        wsService.emit(organizationId, 'RANKINGS_UPDATED', { jobId: req.body.jobId });
        await prisma.notification.create({
          data: { tenantId: organizationId, userId: evaluatedBy, type: 'CANDIDATE_EVALUATED', title: 'Batch Evaluation Submitted', message: `${transformedSuccessful.length} evaluations completed.` }
        });
      }

      return this.ok(res, {
        successful: transformedSuccessful,
        failed: result.data.failed,
      });
    } catch (error) {
      return next(error);
    }
  };

  public recalculateEvaluation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);

      if (!organizationId) {
        return this.badRequest(res, 'Organization ID is required.', 'MISSING_ORGANIZATION_ID');
      }

      // Fetch the existing evaluation first to get candidateId and jobId
      const existing = await (prisma.evaluation.findFirst as any)({
        where: { id: req.params.id, tenantId: organizationId },
        include: { candidate: { select: { jobId: true } } }
      });

      if (!existing) {
        return this.notFound(res, 'Evaluation not found.', 'EVALUATION_NOT_FOUND');
      }

      const result = await this.evaluateCandidateUseCase.execute({
        candidateId: existing.candidateId,
        jobId: existing.candidate?.jobId || 'legacy-job',
        organizationId
      });

      if (!result.success) {
        return this.serverError(res, { message: result.error as string, code: result.code });
      }

      const dto = EvaluationTransformer.toDTO(result.data);
      wsService.emit(organizationId, 'RANKINGS_UPDATED', { jobId: dto.jobId });

      return this.ok(res, dto);
    } catch (error) {
      return next(error);
    }
  };
}
