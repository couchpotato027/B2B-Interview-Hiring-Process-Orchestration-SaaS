import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { Container } from '../../infrastructure/di/Container';
import { GetCandidateDetailsUseCase } from '../../application/use-cases/GetCandidateDetailsUseCase';
import { ProcessResumeUseCase } from '../../application/use-cases/ProcessResumeUseCase';
import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { ValidationError } from '../../shared/errors/ValidationError';

export class CandidateController extends BaseController {
  private readonly container = Container.getInstance();
  private readonly processResumeUseCase =
    this.container.resolve<ProcessResumeUseCase>('ProcessResumeUseCase');
  private readonly getCandidateDetailsUseCase =
    this.container.resolve<GetCandidateDetailsUseCase>('GetCandidateDetailsUseCase');
  private readonly candidateRepository =
    this.container.resolve<ICandidateRepository>('CandidateRepository');

  constructor() {
    super();
  }

  public uploadResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError('Resume file is required.');
      }

      const result = await this.processResumeUseCase.execute({
        file: req.file.buffer,
        fileName: req.file.originalname,
        candidateEmail:
          typeof req.body.candidateEmail === 'string' ? req.body.candidateEmail : undefined,
      });

      if (!result.success) {
        if (result.code === 'MISSING_CANDIDATE_EMAIL' || result.code === 'INVALID_FILE_FORMAT') {
          this.badRequest(res, result.error, result.code);
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

  public getCandidateById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.getCandidateDetailsUseCase.execute({
        candidateId: req.params.id,
      });

      if (!result.success) {
        this.notFound(res, result.error, result.code);
        return;
      }

      this.ok(res, result.data);
    } catch (error) {
      next(error);
    }
  };

  public getCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const candidates = await this.candidateRepository.findAll();
      const filteredCandidates =
        typeof req.query.status === 'string'
          ? candidates.filter((candidate) => candidate.getStatus() === req.query.status)
          : candidates;

      this.ok(res, filteredCandidates);
    } catch (error) {
      next(error);
    }
  };
}
