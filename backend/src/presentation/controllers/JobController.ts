import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { CreateJobUseCase } from '../../application/use-cases/CreateJobUseCase';
import { JobMarketInsightsUseCase } from '../../application/use-cases/JobMarketInsightsUseCase';
import { ComparativeCandidateAnalysisUseCase } from '../../application/use-cases/ComparativeCandidateAnalysisUseCase';
import { Container } from '../../infrastructure/di/Container';
import type { IJobRepository } from '../../domain/repositories/IJobRepository';
import { JobTransformer } from '../transformers/JobTransformer';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';

export class JobController extends BaseController {
  private get createJobUseCase() {
    return Container.getInstance().resolve<CreateJobUseCase>('CreateJobUseCase');
  }
  private get jobRepository() {
    return Container.getInstance().resolve<IJobRepository>('JobRepository');
  }
  private get marketInsightsUseCase() {
    return Container.getInstance().resolve<JobMarketInsightsUseCase>('JobMarketInsightsUseCase');
  }
  private get comparativeAnalysisUseCase() {
    return Container.getInstance().resolve<ComparativeCandidateAnalysisUseCase>('ComparativeCandidateAnalysisUseCase');
  }

  constructor() {
    super();
  }

  public createJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';
      
      const result = await this.createJobUseCase.execute({
        ...req.body,
        organizationId,
      });

      if (!result.success) {
        return this.badRequest(res, result.error as string, result.code);
      }

      return this.rawOk(res, JobTransformer.toDTO(result.data));
    } catch (error) {
      return next(error);
    }
  };

  public getJobById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';

      const job = await this.jobRepository.findById(req.params.id as string, organizationId);

      if (!job) {
        return this.notFound(res, `Job ${req.params.id} not found.`, 'JOB_NOT_FOUND');
      }

      return this.rawOk(res, JobTransformer.toDTO(job));
    } catch (error) {
      return next(error);
    }
  };

  public getJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';

      const jobs =
        typeof req.query.status === 'string'
          ? await this.jobRepository.findByStatus(req.query.status as 'open' | 'closed', organizationId)
          : await this.jobRepository.findAll(organizationId);

      return this.rawOk(res, JobTransformer.toCollectionDTO(jobs));
    } catch (error) {
      return next(error);
    }
  };

  public getMarketInsights = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';

      const result = await this.marketInsightsUseCase.execute({
        jobId: req.params.id as string,
        organizationId
      });

      if (!result.success) {
        this.badRequest(res, result.error as string, result.code);
        return;
      }

      this.rawOk(res, result.data);
    } catch (error) {
      return next(error);
    }
  };

  public getComparativeAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';

      const candidateIds = typeof req.query.candidateIds === 'string' 
        ? req.query.candidateIds.split(',') 
        : (req.query.candidateIds as string[]);

      if (!candidateIds || candidateIds.length < 2) {
        return this.badRequest(res, 'At least 2 candidate IDs are required.', 'INVALID_PARAMETERS');
      }

      const result = await this.comparativeAnalysisUseCase.execute({
        jobId: req.params.id as string,
        candidateIds,
        organizationId
      });

      if (!result.success) {
        this.badRequest(res, result.error as string, result.code);
        return;
      }

      this.rawOk(res, result.data);
    } catch (error) {
      return next(error);
    }
  };
}
