import { Pipeline } from '../../domain/entities/Pipeline';
import { IPipelineRepository } from '../../domain/repositories/IPipelineRepository';

export class InMemoryPipelineRepository implements IPipelineRepository {
  private pipelines: Map<string, Pipeline> = new Map();

  async save(pipeline: Pipeline): Promise<void> {
    this.pipelines.set(pipeline.getId(), pipeline);
  }

  async findById(id: string): Promise<Pipeline | null> {
    return this.pipelines.get(id) || null;
  }

  async findByJobId(jobId: string): Promise<Pipeline | null> {
    return Array.from(this.pipelines.values()).find((p) => p.getJobId() === jobId) || null;
  }

  async findAll(): Promise<Pipeline[]> {
    return Array.from(this.pipelines.values());
  }

  async delete(id: string): Promise<void> {
    this.pipelines.delete(id);
  }
}
