import { CandidatePipelineStatus } from '../entities/CandidatePipelineStatus';

export interface ICandidatePipelineStatusRepository {
  save(status: CandidatePipelineStatus): Promise<void>;
  findById(id: string, organizationId: string): Promise<CandidatePipelineStatus | null>;
  findByCandidateId(candidateId: string, organizationId: string): Promise<CandidatePipelineStatus | null>;
  findByPipelineId(pipelineId: string, organizationId: string): Promise<CandidatePipelineStatus[]>;
  findByStageId(stageId: string, organizationId: string): Promise<CandidatePipelineStatus[]>;
  delete(id: string, organizationId: string): Promise<void>;
}
