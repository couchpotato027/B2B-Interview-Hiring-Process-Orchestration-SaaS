import type { Evaluation } from '../entities/Evaluation';
import type { IRepository } from './IRepository';

export interface IEvaluationRepository extends IRepository<Evaluation> {
  findByJobId(jobId: string): Promise<Evaluation[]>;
  findByCandidateId(candidateId: string): Promise<Evaluation[]>;
}
