import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { CreateJobUseCase } from '../../application/use-cases/CreateJobUseCase';
import { JobMarketInsightsUseCase } from '../../application/use-cases/JobMarketInsightsUseCase';
import { ComparativeCandidateAnalysisUseCase } from '../../application/use-cases/ComparativeCandidateAnalysisUseCase';
import { Container } from '../../infrastructure/di/Container';
import type { IJobRepository } from '../../domain/repositories/IJobRepository';
import { JobTransformer } from '../transformers/JobTransformer';

export class JobController extends BaseController {
  private readonly container = Container.getInstance();
  private readonly createJobUseCase = this.container.resolve<CreateJobUseCase>('CreateJobUseCase');
  private readonly jobRepository = this.container.resolve<IJobRepository>('JobRepository');
  private readonly marketInsightsUseCase = this.container.resolve<JobMarketInsightsUseCase>('JobMarketInsightsUseCase');
  private readonly comparativeAnalysisUseCase = this.container.resolve<ComparativeCandidateAnalysisUseCase>('ComparativeCandidateAnalysisUseCase');

  constructor() {
    super();
  }

  public createJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string);
      
      if (!tenantId) {
        this.badRequest(res, 'Organization ID (tenantId) is required.', 'MISSING_TENANT_ID');
        return;
      }

      const result = await this.createJobUseCase.execute({
        ...req.body,
        tenantId,
      });

      if (!result.success) {
        this.badRequest(res, result.error, result.code);
        return;
      }

      this.created(res, JobTransformer.toDTO(result.data));
    } catch (error) {
      next(error);
    }
  };

  public getJobById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await this.jobRepository.findById(req.params.id as string);

      if (!job) {
        this.notFound(res, `Job ${req.params.id} not found.`, 'JOB_NOT_FOUND');
        return;
      }

      this.ok(res, JobTransformer.toDTO(job));
    } catch (error) {
      next(error);
    }
  };

  public getJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobs =
        typeof req.query.status === 'string'
          ? await this.jobRepository.findByStatus(req.query.status as 'open' | 'closed')
          : await this.jobRepository.findAll();

      this.ok(res, JobTransformer.toCollectionDTO(jobs));
    } catch (error) {
      next(error);
    }
  };

  public getMarketInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.marketInsightsUseCase.execute({
        jobId: req.params.id as string,
      });

      if (!result.success) {
        this.badRequest(res, result.error, result.code);
        return;
      }

      this.ok(res, result.data);
    } catch (error) {
      next(error);
    }
  };

  public getComparativeAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const candidateIds = typeof req.query.candidateIds === 'string' 
        ? req.query.candidateIds.split(',') 
        : (req.query.candidateIds as string[]);

      if (!candidateIds || candidateIds.length < 2) {
        this.badRequest(res, 'At least 2 candidate IDs are required.', 'INVALID_PARAMETERS');
        return;
      }

      const result = await this.comparativeAnalysisUseCase.execute({
        jobId: req.params.id as string,
        candidateIds,
      });

      if (!result.success) {
        this.badRequest(res, result.error, result.code);
        return;
      }

      this.ok(res, result.data);
    } catch (error) {
      next(error);
    }
  };
}
