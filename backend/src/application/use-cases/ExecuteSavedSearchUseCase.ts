import { ISavedSearchRepository } from '../../domain/repositories/ISavedSearchRepository';
import { SearchCandidatesUseCase } from './SearchCandidatesUseCase';
import { SearchResults, SearchQuery } from '../../domain/types/SearchTypes';
import { Result } from '../../shared/Result';

export interface ExecuteSavedSearchInput {
  savedSearchId: string;
  organizationId: string;
}

export class ExecuteSavedSearchUseCase {
  constructor(
    private readonly savedSearchRepository: ISavedSearchRepository,
    private readonly searchCandidatesUseCase : SearchCandidatesUseCase
  ) {}

  public async execute(input: ExecuteSavedSearchInput): Promise<Result<SearchResults>> {
    try {
      const savedSearch = await this.savedSearchRepository.findById(input.savedSearchId, input.organizationId);
      
      if (!savedSearch) {
        return { success: false, error: 'Saved search not found', code: 'SAVED_SEARCH_NOT_FOUND' };
      }

      const results = await this.searchCandidatesUseCase.execute({
        ...savedSearch.getQuery(),
        organizationId: input.organizationId,
      } as SearchQuery);
      
      return results;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        code: 'EXECUTION_FAILED',
      };
    }
  }
}
