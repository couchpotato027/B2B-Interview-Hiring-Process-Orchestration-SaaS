import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { Container } from '../../infrastructure/di/Container';
import { SearchCandidatesUseCase } from '../../application/use-cases/SearchCandidatesUseCase';
import { GetSuggestedCandidatesUseCase } from '../../application/use-cases/GetSuggestedCandidatesUseCase';
import { FindSimilarCandidatesUseCase } from '../../application/use-cases/FindSimilarCandidatesUseCase';
import { SaveSearchUseCase } from '../../application/use-cases/SaveSearchUseCase';
import { ExecuteSavedSearchUseCase } from '../../application/use-cases/ExecuteSavedSearchUseCase';
import { ISavedSearchRepository } from '../../domain/repositories/ISavedSearchRepository';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';
import { CandidateTransformer } from '../transformers/CandidateTransformer';

export class SearchController extends BaseController {
  private get searchUseCase() {
    return Container.getInstance().resolve<SearchCandidatesUseCase>('SearchCandidatesUseCase');
  }
  private get suggestionsUseCase() {
    return Container.getInstance().resolve<GetSuggestedCandidatesUseCase>('GetSuggestedCandidatesUseCase');
  }
  private get similarUseCase() {
    return Container.getInstance().resolve<FindSimilarCandidatesUseCase>('FindSimilarCandidatesUseCase');
  }
  private get saveSearchUseCase() {
    return Container.getInstance().resolve<SaveSearchUseCase>('SaveSearchUseCase');
  }
  private get executeSavedUseCase() {
    return Container.getInstance().resolve<ExecuteSavedSearchUseCase>('ExecuteSavedSearchUseCase');
  }
  private get savedSearchRepo() {
    return Container.getInstance().resolve<ISavedSearchRepository>('SavedSearchRepository');
  }

  constructor() {
    super();
  }

  public search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);

      const result = await this.searchUseCase.execute({
        ...req.body,
        organizationId,
      });

      if (!result.success) {
        this.badRequest(res, result.error as string, result.code);
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

  public getSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);

      const result = await this.suggestionsUseCase.execute({
        jobId: req.params.jobId as string,
        organizationId,
      });

      if (!result.success) {
        this.notFound(res, result.error as string, result.code);
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

  public getSimilar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);

      const result = await this.similarUseCase.execute({
        candidateId: req.params.candidateId as string,
        organizationId,
      });

      if (!result.success) {
        this.notFound(res, result.error as string, result.code);
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

  public saveSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);
      const userId = authReq.user?.userId || 'anonymous';

      const result = await this.saveSearchUseCase.execute({
        userId,
        organizationId,
        name: req.body.name as string,
        query: req.body.query,
      });

      if (!result.success) {
        this.badRequest(res, result.error as string, result.code);
        return;
      }

      this.created(res, result.data);
    } catch (error) {
      next(error);
    }
  };

  public getSavedSearches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);
      const userId = authReq.user?.userId || 'anonymous';

      const savedSearches = await this.savedSearchRepo.findByUserId(userId, organizationId);
      this.ok(res, savedSearches);
    } catch (error) {
      next(error);
    }
  };

  public executeSavedSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);

      const result = await this.executeSavedUseCase.execute({
        savedSearchId: req.params.id as string,
        organizationId,
      });

      if (!result.success) {
        this.notFound(res, result.error as string, result.code);
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

  public deleteSavedSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);

      await this.savedSearchRepo.delete(req.params.id as string, organizationId);
      this.ok(res, { success: true });
    } catch (error) {
      next(error);
    }
  };
}
