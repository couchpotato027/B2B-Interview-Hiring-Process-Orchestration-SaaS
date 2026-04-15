import type { Candidate, CandidateStatus } from '../entities/Candidate';
import type { IRepository } from './IRepository';
import type { PaginatedResult, PaginationParams } from '../types/Pagination';

export interface CandidateFilters extends PaginationParams {
  status?: CandidateStatus;
  organizationId?: string;
}

export interface ICandidateRepository extends IRepository<Candidate> {
  findByEmail(email: string, organizationId: string): Promise<Candidate | null>;
  findWithFilters(filters: CandidateFilters, organizationId: string): Promise<PaginatedResult<Candidate>>;
}
