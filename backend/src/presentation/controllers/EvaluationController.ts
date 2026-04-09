import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { Container } from '../../infrastructure/di/Container';
import { EvaluateCandidateUseCase } from '../../application/use-cases/EvaluateCandidateUseCase';
import { RankCandidatesForJobUseCase } from '../../application/use-cases/RankCandidatesForJobUseCase';
import { BatchEvaluationUseCase } from '../../application/use-cases/BatchEvaluationUseCase';
import { EvaluationTransformer } from '../transformers/EvaluationTransformer';
import { wsService } from '../integration/websocket';

export class EvaluationController extends BaseController {
  private readonly container = Container.getInstance();
  private readonly evaluateCandidateUseCase =
    this.container.resolve<EvaluateCandidateUseCase>('EvaluateCandidateUseCase');
  private readonly rankCandidatesForJobUseCase =
    this.container.resolve<RankCandidatesForJobUseCase>('RankCandidatesForJobUseCase');
  private readonly batchEvaluationUseCase =
    this.container.resolve<BatchEvaluationUseCase>('BatchEvaluationUseCase');

  constructor() {
    super();
  }

  public createEvaluation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.evaluateCandidateUseCase.execute(req.body);

      if (!result.success) {
        const isNotFound = result.code === 'CANDIDATE_NOT_FOUND' || result.code === 'JOB_NOT_FOUND';
        if (isNotFound) {
          this.notFound(res, result.error, result.code);
          return;
        }

        this.serverError(res, { message: result.error, code: result.code });
        return;
      }

      const dto = EvaluationTransformer.toDTO(result.data);
      
      // Emit real-time events
      const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string) || 'org-123';
      
      wsService.emit(tenantId, 'EVALUATION_COMPLETED', dto);
      wsService.emit(tenantId, 'RANKINGS_UPDATED', { jobId: dto.jobId });

      this.created(res, dto);
    } catch (error) {
      next(error);
    }
  };

  public getJobRankings = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.rankCandidatesForJobUseCase.execute({
        jobId: req.params.jobId as string,
      });

      if (!result.success) {
        const isNotFound = result.code === 'JOB_NOT_FOUND';
        if (isNotFound) {
          this.notFound(res, result.error, result.code);
          return;
        }

        this.badRequest(res, result.error, result.code);
        return;
      }

      this.ok(res, result.data);
    } catch (error) {
      next(error);
    }
  };

  public createBatchEvaluation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.batchEvaluationUseCase.execute(req.body);

      if (!result.success) {
        this.serverError(res, { message: result.error, code: result.code });
        return;
      }

      // Transform successful evaluations
      const transformedSuccessful = result.data.successful.map((e) =>
        EvaluationTransformer.toDTO(e),
      );

      // Emit real-time events for each successful evaluation
      const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string) || 'org-123';
      
      transformedSuccessful.forEach((dto) => {
        wsService.emit(tenantId, 'EVALUATION_COMPLETED', dto);
      });

      if (transformedSuccessful.length > 0) {
        wsService.emit(tenantId, 'RANKINGS_UPDATED', { jobId: req.body.jobId });
      }

      this.ok(res, {
        successful: transformedSuccessful,
        failed: result.data.failed,
      });
    } catch (error) {
      next(error);
    }
  };
}
