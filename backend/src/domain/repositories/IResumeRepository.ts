import type { Resume } from '../entities/Resume';
import type { IRepository } from './IRepository';

export interface IResumeRepository extends IRepository<Resume> {
  findByCandidateId(candidateId: string, organizationId: string): Promise<Resume | null>;
}
