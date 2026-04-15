import { ISearchService } from '../../domain/services/ISearchService';
import { IJobRepository } from '../../domain/repositories/IJobRepository';
import { SearchResults } from '../../domain/types/SearchTypes';
import { Result } from '../../shared/Result';

export interface GetSuggestedCandidatesInput {
  jobId: string;
  organizationId: string;
}

export class GetSuggestedCandidatesUseCase {
  constructor(
    private readonly searchService: ISearchService,
    private readonly jobRepository: IJobRepository
  ) {}

  public async execute(input: GetSuggestedCandidatesInput): Promise<Result<SearchResults>> {
    try {
      const job = await this.jobRepository.findById(input.jobId, input.organizationId);
      
      if (!job) {
        return { success: false, error: 'Job not found', code: 'JOB_NOT_FOUND' };
      }

      // Logic: Search for candidates who have ALL required skills and match the level
      // We'll use the search service with specific filters derived from the job
      const query = {
        organizationId: input.organizationId,
        skills: job.getRequiredSkills(),
        minExperience: job.getRequiredExperience(),
        sortBy: 'relevance' as const,
        limit: 10,
      };

      const results = await this.searchService.searchCandidates(query);
      
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Suggestion generation failed',
        code: 'SUGGESTION_FAILED',
      };
    }
  }
}
