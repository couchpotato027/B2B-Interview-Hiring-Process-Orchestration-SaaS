import { Candidate } from '../entities/Candidate';
import { Resume } from '../entities/Resume';
import { CandidatePipelineStatus } from '../entities/CandidatePipelineStatus';
import { SearchQuery, SearchResults } from '../types/SearchTypes';

export interface ISearchService {
  /**
   * Indexes a candidate and their resume content.
   */
  indexCandidate(
    candidate: Candidate, 
    resume?: Resume, 
    pipelineStatus?: CandidatePipelineStatus
  ): Promise<void>;

  /**
   * Searches candidates based on the provided query and organizationId.
   */
  searchCandidates(query: SearchQuery): Promise<SearchResults>;

  /**
   * Removes a candidate from the search index.
   */
  deleteFromIndex(candidateId: string, organizationId: string): Promise<void>;

  /**
   * Updates existing index entry with partial data.
   */
  updateIndex(candidateId: string, updates: Partial<any>, organizationId: string): Promise<void>;

  /**
   * Rebuilds the search index for an organization from scratch.
   */
  rebuildIndex(
    organizationId: string, 
    candidates: Candidate[], 
    resumes: Resume[], 
    pipelineStatuses: CandidatePipelineStatus[]
  ): Promise<void>;
}
