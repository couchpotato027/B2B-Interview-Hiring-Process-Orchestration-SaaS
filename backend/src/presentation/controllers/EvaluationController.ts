import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { EvaluateCandidateUseCase } from '../../application/use-cases/EvaluateCandidateUseCase';
import { RankCandidatesForJobUseCase } from '../../application/use-cases/RankCandidatesForJobUseCase';
import { BatchEvaluationUseCase } from '../../application/use-cases/BatchEvaluationUseCase';
import { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import { Container } from '../../infrastructure/di/Container';
import { EvaluationTransformer } from '../transformers/EvaluationTransformer';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';
import { CandidateTransformer } from '../transformers/CandidateTransformer';
import { auditService } from '../../application/services/AuditService';

export class EvaluationController extends BaseController {
  private get evaluateCandidateUseCase() {
    return Container.getInstance().resolve<EvaluateCandidateUseCase>('EvaluateCandidateUseCase');
  }

  private get rankCandidatesUseCase() {
    return Container.getInstance().resolve<RankCandidatesForJobUseCase>('RankCandidatesForJobUseCase');
  }

  private get batchEvaluationUseCase() {
    return Container.getInstance().resolve<BatchEvaluationUseCase>('BatchEvaluationUseCase');
  }

  private get evaluationRepository() {
    return Container.getInstance().resolve<IEvaluationRepository>('EvaluationRepository');
  }

  public createEvaluation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || 'default-tenant';

      const result = await this.evaluateCandidateUseCase.execute({
        candidateId: req.body.candidateId,
        jobId: req.body.jobId,
        organizationId
      });

      if (!result.success) {
        return this.badRequest(res, result.error as string, result.code);
      }

      // Audit Log
      await auditService.log({
        tenantId: organizationId,
        userId: authReq.user?.userId,
        action: 'CREATE',
        resource: 'Evaluation',
        resourceId: result.data.getId(),
        changes: { candidateId: req.body.candidateId, jobId: req.body.jobId },
        ipAddress: req.ip
      });

      return this.rawOk(res, EvaluationTransformer.toDTO(result.data));
    } catch (error) {
      return next(error);
    }
  };

  public getJobRankings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || 'default-tenant';
      const { jobId } = req.params;

      const result = await this.rankCandidatesUseCase.execute({
        jobId: jobId as string,
        organizationId
      });

      if (!result.success) {
        return this.badRequest(res, result.error as string, result.code);
      }

      // Transform result
      const data = result.data.map(item => ({
        candidate: CandidateTransformer.toDTO(item.candidate),
        evaluation: EvaluationTransformer.toDTO(item.evaluation),
        rank: item.rank
      }));

      return this.rawOk(res, data);
    } catch (error) {
      return next(error);
    }
  };

  public createBatchEvaluation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || 'default-tenant';
      const { jobId, candidateIds } = req.body;

      const result = await this.batchEvaluationUseCase.execute({
        jobId,
        candidateIds,
        organizationId
      });

      if (!result.success) {
        return this.badRequest(res, result.error as string, result.code);
      }

      return this.rawOk(res, {
        successful: result.data.successful.map(e => EvaluationTransformer.toDTO(e)),
        failed: result.data.failed
      });
    } catch (error) {
      return next(error);
    }
  };

  public recalculateEvaluation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || 'default-tenant';
      const { id } = req.params;

      const existing = await this.evaluationRepository.findById(id as string, organizationId);
      if (!existing) {
        return this.notFound(res, 'Evaluation not found');
      }

      const result = await this.evaluateCandidateUseCase.execute({
        candidateId: existing.getCandidateId(),
        jobId: existing.getJobId(),
        organizationId
      });

      if (!result.success) {
        return this.badRequest(res, result.error as string, result.code);
      }

      return this.rawOk(res, EvaluationTransformer.toDTO(result.data));
    } catch (error) {
      return next(error);
    }
  };

  public getCandidateEvaluations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || 'default-tenant';
      const { candidateId } = req.params;

      const evaluations = await this.evaluationRepository.findByCandidateId(candidateId as string, organizationId);
      
      return this.rawOk(res, evaluations.map(e => EvaluationTransformer.toDTO(e)));
    } catch (error) {
      return next(error);
    }
  };
}
