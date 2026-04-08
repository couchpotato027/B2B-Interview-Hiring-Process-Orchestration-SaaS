import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { CreateJobUseCase } from '../../application/use-cases/CreateJobUseCase';
import { Container } from '../../infrastructure/di/Container';
import type { IJobRepository } from '../../domain/repositories/IJobRepository';

export class JobController extends BaseController {
  private readonly container = Container.getInstance();
  private readonly createJobUseCase = this.container.resolve<CreateJobUseCase>('CreateJobUseCase');
  private readonly jobRepository = this.container.resolve<IJobRepository>('JobRepository');

  constructor() {
    super();
  }

  public createJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.createJobUseCase.execute(req.body);

      if (!result.success) {
        this.badRequest(res, result.error, result.code);
        return;
      }

      this.created(res, result.data);
    } catch (error) {
      next(error);
    }
  };

  public getJobById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await this.jobRepository.findById(req.params.id);

      if (!job) {
        this.notFound(res, `Job ${req.params.id} not found.`, 'JOB_NOT_FOUND');
        return;
      }

      this.ok(res, job);
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

      this.ok(res, jobs);
    } catch (error) {
      next(error);
    }
  };
}
