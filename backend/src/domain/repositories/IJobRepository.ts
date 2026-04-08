import type { Job, JobStatus } from '../entities/Job';
import type { IRepository } from './IRepository';

export interface IJobRepository extends IRepository<Job> {
  findByStatus(status: JobStatus): Promise<Job[]>;
}
