import { ISearchService } from '../../domain/services/ISearchService';
import { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { SearchResults } from '../../domain/types/SearchTypes';
import { Result } from '../../shared/Result';

export interface FindSimilarCandidatesInput {
  candidateId: string;
  organizationId: string;
}

export class FindSimilarCandidatesUseCase {
  constructor(
    private readonly searchService: ISearchService,
    private readonly candidateRepository: ICandidateRepository
  ) {}

  public async execute(input: FindSimilarCandidatesInput): Promise<Result<SearchResults>> {
    try {
      const candidate = await this.candidateRepository.findById(input.candidateId, input.organizationId);
      
      if (!candidate) {
        return { success: false, error: 'Candidate not found', code: 'CANDIDATE_NOT_FOUND' };
      }

      // Logic: Find candidates with high skill overlap
      // We'll use the search service with the current candidate's skills as the text query 
      // and also filter by experience range (+/- 2 years)
      const query = {
        organizationId: input.organizationId,
        textQuery: candidate.getSkills().join(' '),
        minExperience: Math.max(0, candidate.getYearsOfExperience() - 2),
        maxExperience: candidate.getYearsOfExperience() + 2,
        sortBy: 'relevance' as const,
        limit: 11, // Fetch 11 to exclude self later
      };

      const results = await this.searchService.searchCandidates(query);
      
      // Exclude the candidate themselves
      results.items = results.items.filter(items => items.getId() !== input.candidateId).slice(0, 10);
      results.total = results.items.length;

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Similarity search failed',
        code: 'SIMILARITY_FAILED',
      };
    }
  }
}
