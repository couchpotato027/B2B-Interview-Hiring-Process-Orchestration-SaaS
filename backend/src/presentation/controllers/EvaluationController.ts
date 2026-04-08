import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { Container } from '../../infrastructure/di/Container';
import { EvaluateCandidateUseCase } from '../../application/use-cases/EvaluateCandidateUseCase';
import { RankCandidatesForJobUseCase } from '../../application/use-cases/RankCandidatesForJobUseCase';

export class EvaluationController extends BaseController {
  private readonly container = Container.getInstance();
  private readonly evaluateCandidateUseCase =
    this.container.resolve<EvaluateCandidateUseCase>('EvaluateCandidateUseCase');
  private readonly rankCandidatesForJobUseCase =
    this.container.resolve<RankCandidatesForJobUseCase>('RankCandidatesForJobUseCase');

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

      this.created(res, result.data);
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
        jobId: req.params.jobId,
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
}
