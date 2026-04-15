import { Pipeline } from '../../domain/entities/Pipeline';
import { IPipelineRepository } from '../../domain/repositories/IPipelineRepository';

export class InMemoryPipelineRepository implements IPipelineRepository {
  private pipelines: Map<string, Pipeline> = new Map();

  async save(pipeline: Pipeline): Promise<void> {
    this.pipelines.set(pipeline.getId(), pipeline);
  }

  async findById(id: string, organizationId: string): Promise<Pipeline | null> {
    const pipeline = this.pipelines.get(id);
    if (pipeline && pipeline.getOrganizationId() === organizationId) {
      return pipeline;
    }
    return null;
  }

  async findByJobId(jobId: string, organizationId: string): Promise<Pipeline | null> {
    return Array.from(this.pipelines.values()).find(
      (p) => p.getJobId() === jobId && p.getOrganizationId() === organizationId
    ) || null;
  }

  async findByOrganizationId(organizationId: string): Promise<Pipeline[]> {
      return this.findAll(organizationId);
  }

  async findAll(organizationId: string): Promise<Pipeline[]> {
    return Array.from(this.pipelines.values()).filter(p => p.getOrganizationId() === organizationId);
  }

  async delete(id: string, organizationId?: string): Promise<void> {
    // If organizationId is provided, we check access first
    if (organizationId) {
        const existing = this.pipelines.get(id);
        if (existing && existing.getOrganizationId() === organizationId) {
            this.pipelines.delete(id);
        }
    } else {
        this.pipelines.delete(id);
    }
  }
}
