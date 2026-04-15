import type { Job, JobStatus } from '../entities/Job';
import type { IRepository } from './IRepository';

export interface IJobRepository extends IRepository<Job> {
  findByStatus(status: JobStatus, organizationId: string): Promise<Job[]>;
  findByOrganizationId(organizationId: string): Promise<Job[]>;
}
