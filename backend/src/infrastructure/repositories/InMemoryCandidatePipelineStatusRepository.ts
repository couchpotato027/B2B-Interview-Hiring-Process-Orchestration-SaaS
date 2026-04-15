import { CandidatePipelineStatus } from '../../domain/entities/CandidatePipelineStatus';
import { ICandidatePipelineStatusRepository } from '../../domain/repositories/ICandidatePipelineStatusRepository';

export class InMemoryCandidatePipelineStatusRepository implements ICandidatePipelineStatusRepository {
  private statuses: Map<string, CandidatePipelineStatus> = new Map();

  async save(status: CandidatePipelineStatus): Promise<void> {
    this.statuses.set(status.getId(), status);
  }

  async findById(id: string, organizationId: string): Promise<CandidatePipelineStatus | null> {
    const status = this.statuses.get(id);
    if (status && status.getOrganizationId() === organizationId) {
      return status;
    }
    return null;
  }

  async findByCandidateId(candidateId: string, organizationId: string): Promise<CandidatePipelineStatus | null> {
    return Array.from(this.statuses.values()).find(
      (s) => s.getCandidateId() === candidateId && s.getOrganizationId() === organizationId
    ) || null;
  }

  async findByPipelineId(pipelineId: string, organizationId: string): Promise<CandidatePipelineStatus[]> {
    return Array.from(this.statuses.values()).filter(
      (s) => s.getPipelineId() === pipelineId && s.getOrganizationId() === organizationId
    );
  }

  async findByStageId(stageId: string, organizationId: string): Promise<CandidatePipelineStatus[]> {
    return Array.from(this.statuses.values()).filter(
      (s) => s.getCurrentStageId() === stageId && s.getOrganizationId() === organizationId
    );
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const existing = this.statuses.get(id);
    if (existing && existing.getOrganizationId() === organizationId) {
      this.statuses.delete(id);
    }
  }
}
