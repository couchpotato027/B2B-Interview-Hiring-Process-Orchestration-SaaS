import type { Candidate } from '../entities/Candidate';
import type { Job } from '../entities/Job';

export interface IScoringStrategy {
  calculate(candidate: Candidate, job: Job): Promise<number>;
  getName(): string;
  getWeight(job?: Job): number;
}
