import type { Candidate } from '../entities/Candidate';
import type { IRepository } from './IRepository';

export interface ICandidateRepository extends IRepository<Candidate> {
  findByEmail(email: string): Promise<Candidate | null>;
}
