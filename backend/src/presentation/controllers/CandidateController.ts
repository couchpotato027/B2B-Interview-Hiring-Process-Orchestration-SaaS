import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { Container } from '../../infrastructure/di/Container';
import { GetCandidateDetailsUseCase } from '../../application/use-cases/GetCandidateDetailsUseCase';
import { ListCandidatesUseCase } from '../../application/use-cases/ListCandidatesUseCase';
import { ProcessResumeUseCase } from '../../application/use-cases/ProcessResumeUseCase';
import { ResumeFeedbackUseCase } from '../../application/use-cases/ResumeFeedbackUseCase';
import { SearchCandidatesUseCase } from '../../application/use-cases/SearchCandidatesUseCase';
import { MoveCandidateThroughPipelineUseCase } from '../../application/use-cases/MoveCandidateThroughPipelineUseCase';
import type { CandidateStatus } from '../../domain/entities/Candidate';
import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { ValidationError } from '../../shared/errors/ValidationError';
import { CandidateTransformer } from '../transformers/CandidateTransformer';
import { wsService } from '../integration/websocket';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';

export class CandidateController extends BaseController {
  private get processResumeUseCase() {
    return Container.getInstance().resolve<ProcessResumeUseCase>('ProcessResumeUseCase');
  }
  private get getCandidateDetailsUseCase() {
    return Container.getInstance().resolve<GetCandidateDetailsUseCase>('GetCandidateDetailsUseCase');
  }
  private get listCandidatesUseCase() {
    return Container.getInstance().resolve<ListCandidatesUseCase>('ListCandidatesUseCase');
  }
  private get resumeFeedbackUseCase() {
    return Container.getInstance().resolve<ResumeFeedbackUseCase>('ResumeFeedbackUseCase');
  }
  private get candidateRepository() {
    return Container.getInstance().resolve<ICandidateRepository>('CandidateRepository');
  }
  private get searchCandidatesUseCase() {
    return Container.getInstance().resolve<SearchCandidatesUseCase>('SearchCandidatesUseCase');
  }
  private get moveCandidateUseCase() {
    return Container.getInstance().resolve<MoveCandidateThroughPipelineUseCase>('MoveCandidateThroughPipelineUseCase');
  }

  constructor() {
    super();
  }

  public uploadResume = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ValidationError('Resume file is required.');
      }

      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';

      const result = await this.processResumeUseCase.execute({
        file: req.file.buffer,
        fileName: req.file.originalname,
        organizationId,
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
      wsService.emit(organizationId, 'CANDIDATE_ADDED', dto);

      return this.rawOk(res, dto);
    } catch (error) {
      return next(error);
    }
  };

  public getCandidateById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.params.id) {
        this.badRequest(res, 'Candidate ID is required.', 'MISSING_CANDIDATE_ID');
        return;
      }

      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';
      
      const result = await this.getCandidateDetailsUseCase.execute({
        candidateId: req.params.id as string,
        organizationId
      });

      if (!result.success) {
        this.notFound(res, String(result.error), result.code);
        return;
      }

      return this.rawOk(res, CandidateTransformer.toDetailedDTO(result.data));
    } catch (error) {
      return next(error);
    }
  };

  public getCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as CandidateStatus;
      const query = req.query.q as string;

      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';

      if (query) {
        const result = await this.searchCandidatesUseCase.execute({
          textQuery: query,
          organizationId,
          page,
          limit
        });

        if (!result.success) {
          this.serverError(res, { message: String(result.error), code: result.code });
          return;
        }

        return this.rawOk(res, CandidateTransformer.toCollectionDTO(result.data.items));
      }

      const result = await this.listCandidatesUseCase.execute({
        status,
        organizationId,
        page,
        limit,
      });

      if (!result.success) {
        this.serverError(res, { message: String(result.error), code: result.code });
        return;
      }

      return this.rawOk(res, CandidateTransformer.toCollectionDTO(result.data.items));
    } catch (error) {
      return next(error);
    }
  };

  public moveStage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const newStageId = req.body.newStageId as string;
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';

      const candidate = await this.candidateRepository.findById(id, organizationId);
      if (!candidate) {
        this.notFound(res, 'Candidate not found.', 'CANDIDATE_NOT_FOUND');
        return;
      }

      const result = await this.moveCandidateUseCase.execute({
        candidateId: id,
        pipelineId: candidate.getPipelineId(),
        newStageId,
        organizationId,
        movedBy: authReq.user?.userId || 'admin@hireflow.com',
        reason: req.body.reason,
      });

      return this.rawOk(res, result);
    } catch (error) {
      return next(error);
    }
  };

  public reject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return this.rawOk(res, { success: true, message: 'Candidate rejected (Clean Arch Bridge)' });
    } catch (error) {
      return next(error);
    }
  };

  public hire = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return this.rawOk(res, { success: true, message: 'Candidate hired (Clean Arch Bridge)' });
    } catch (error) {
      return next(error);
    }
  };

  public getResumeFeedback = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';

      const result = await this.resumeFeedbackUseCase.execute({
        candidateId: req.params.id as string,
        organizationId
      });

      if (!result.success) {
        if (result.code === 'CANDIDATE_NOT_FOUND' || result.code === 'RESUME_NOT_FOUND') {
          this.notFound(res, result.error as string, result.code);
          return;
        }

        this.serverError(res, { message: result.error as string, code: result.code });
        return;
      }

      return this.rawOk(res, result.data);
    } catch (error) {
      return next(error);
    }
  };
}
