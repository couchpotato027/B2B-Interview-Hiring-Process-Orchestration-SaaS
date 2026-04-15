import { Pipeline } from '../entities/Pipeline';

export interface IPipelineRepository {
  save(pipeline: Pipeline): Promise<void>;
  findById(id: string, organizationId: string): Promise<Pipeline | null>;
  findByJobId(jobId: string, organizationId: string): Promise<Pipeline | null>;
  findAll(organizationId: string): Promise<Pipeline[]>;
  delete(id: string): Promise<void>;
}
