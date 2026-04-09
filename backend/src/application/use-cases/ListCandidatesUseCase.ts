import type { Candidate, CandidateStatus } from '../../domain/entities/Candidate';
import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import type { PaginatedResult } from '../../domain/types/Pagination';
import type { Result } from '../../shared/Result';

export interface ListCandidatesInput {
  status?: CandidateStatus;
  tenantId: string;
  page?: number;
  limit?: number;
}

export interface ListCandidatesDependencies {
  candidateRepository: ICandidateRepository;
}

export class ListCandidatesUseCase {
  constructor(private readonly dependencies: ListCandidatesDependencies) {}

  public async execute(
    input: ListCandidatesInput,
  ): Promise<Result<PaginatedResult<Candidate>>> {
    const { status, tenantId, page = 1, limit = 10 } = input;

    try {
      const result = await this.dependencies.candidateRepository.findWithFilters({
        status,
        tenantId,
        page,
        limit,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list candidates',
        code: 'LIST_CANDIDATES_ERROR',
      };
    }
  }
}
