import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { Container } from '../../infrastructure/di/Container';
import { GetCandidateDetailsUseCase } from '../../application/use-cases/GetCandidateDetailsUseCase';
import { ListCandidatesUseCase } from '../../application/use-cases/ListCandidatesUseCase';
import { ProcessResumeUseCase } from '../../application/use-cases/ProcessResumeUseCase';
import { ResumeFeedbackUseCase } from '../../application/use-cases/ResumeFeedbackUseCase';
import type { CandidateStatus } from '../../domain/entities/Candidate';
import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { ValidationError } from '../../shared/errors/ValidationError';
import { CandidateTransformer } from '../transformers/CandidateTransformer';
import { wsService } from '../integration/websocket';

export class CandidateController extends BaseController {
  private readonly container = Container.getInstance();
  private readonly processResumeUseCase =
    this.container.resolve<ProcessResumeUseCase>('ProcessResumeUseCase');
  private readonly getCandidateDetailsUseCase =
    this.container.resolve<GetCandidateDetailsUseCase>('GetCandidateDetailsUseCase');
  private readonly listCandidatesUseCase =
    this.container.resolve<ListCandidatesUseCase>('ListCandidatesUseCase');
  private readonly resumeFeedbackUseCase =
    this.container.resolve<ResumeFeedbackUseCase>('ResumeFeedbackUseCase');
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

      // Extract tenantId from context or header
      const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string);

      if (!tenantId) {
        this.badRequest(res, 'Organization ID (tenantId) is required.', 'MISSING_TENANT_ID');
        return;
      }

      const result = await this.processResumeUseCase.execute({
        file: req.file.buffer,
        fileName: req.file.originalname,
        tenantId,
        candidateEmail:
          typeof req.body.candidateEmail === 'string' ? req.body.candidateEmail : undefined,
      });

      if (!result.success) {
        if (result.code === 'MISSING_CANDIDATE_EMAIL' || result.code === 'INVALID_FILE_FORMAT') {
          this.badRequest(res, String(result.error), result.code);
          return;
        }

        this.serverError(res, { message: String(result.error), code: result.code });
        return;
      }

      const dto = CandidateTransformer.toDetailedDTO(result.data);
      
      // Broadcast to organizational room
      wsService.emit(tenantId, 'CANDIDATE_ADDED', dto);

      this.created(res, dto);
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
      if (!req.params.id) {
        this.badRequest(res, 'Candidate ID is required.', 'MISSING_CANDIDATE_ID');
        return;
      }

      const result = await this.getCandidateDetailsUseCase.execute({
        candidateId: req.params.id as string,
      });

      if (!result.success) {
        this.notFound(res, String(result.error), result.code);
        return;
      }

      this.ok(res, CandidateTransformer.toDetailedDTO(result.data));
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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as CandidateStatus;

      // In a real scenario, tenantId would come from the auth token (req.user.tenantId)
      // For the Clean Architecture layer, we'll look for X-Tenant-Id header if not in user context
      const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string);

      if (!tenantId) {
        this.badRequest(res, 'Organization ID (tenantId) is required.', 'MISSING_TENANT_ID');
        return;
      }

      const result = await this.listCandidatesUseCase.execute({
        status,
        tenantId,
        page,
        limit,
      });

      if (!result.success) {
        this.serverError(res, { message: String(result.error), code: result.code });
        return;
      }

      this.ok(res, {
        ...result.data,
        items: CandidateTransformer.toCollectionDTO(result.data.items),
      });
    } catch (error) {
      next(error);
    }
  };

  public getResumeFeedback = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.resumeFeedbackUseCase.execute({
        candidateId: req.params.id as string,
      });

      if (!result.success) {
        if (result.code === 'CANDIDATE_NOT_FOUND' || result.code === 'RESUME_NOT_FOUND') {
          this.notFound(res, result.error, result.code);
          return;
        }

        this.serverError(res, { message: result.error, code: result.code });
        return;
      }

      this.ok(res, result.data);
    } catch (error) {
      next(error);
    }
  };
}
