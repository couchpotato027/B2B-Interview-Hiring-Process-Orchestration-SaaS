import { Pipeline } from '../entities/Pipeline';

export interface IPipelineRepository {
  save(pipeline: Pipeline): Promise<void>;
  findById(id: string): Promise<Pipeline | null>;
  findByJobId(jobId: string): Promise<Pipeline | null>;
  findAll(): Promise<Pipeline[]>;
  delete(id: string): Promise<void>;
}
