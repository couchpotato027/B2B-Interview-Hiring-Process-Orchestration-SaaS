import { CandidatePipelineStatus } from '../../domain/entities/CandidatePipelineStatus';
import { ICandidatePipelineStatusRepository } from '../../domain/repositories/ICandidatePipelineStatusRepository';

export class InMemoryCandidatePipelineStatusRepository implements ICandidatePipelineStatusRepository {
  private statuses: Map<string, CandidatePipelineStatus> = new Map();

  async save(status: CandidatePipelineStatus): Promise<void> {
    this.statuses.set(status.getId(), status);
  }

  async findById(id: string): Promise<CandidatePipelineStatus | null> {
    return this.statuses.get(id) || null;
  }

  async findByCandidateId(candidateId: string): Promise<CandidatePipelineStatus | null> {
    return Array.from(this.statuses.values()).find((s) => s.getCandidateId() === candidateId) || null;
  }

  async findByPipelineId(pipelineId: string): Promise<CandidatePipelineStatus[]> {
    return Array.from(this.statuses.values()).filter((s) => s.getPipelineId() === pipelineId);
  }

  async findByStageId(stageId: string): Promise<CandidatePipelineStatus[]> {
    return Array.from(this.statuses.values()).filter((s) => s.getCurrentStageId() === stageId);
  }

  async delete(id: string): Promise<void> {
    this.statuses.delete(id);
  }
}
