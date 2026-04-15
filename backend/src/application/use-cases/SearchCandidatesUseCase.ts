import { ISearchService } from '../../domain/services/ISearchService';
import { SearchQuery, SearchResults } from '../../domain/types/SearchTypes';
import { Result } from '../../shared/Result';

export class SearchCandidatesUseCase {
  constructor(private readonly searchService: ISearchService) {}

  public async execute(query: SearchQuery): Promise<Result<SearchResults>> {
    try {
      // Data isolation is handled by the query.organizationId passed to the storage/search service
      const results = await this.searchService.searchCandidates(query);
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        code: 'SEARCH_FAILED',
      };
    }
  }
}
