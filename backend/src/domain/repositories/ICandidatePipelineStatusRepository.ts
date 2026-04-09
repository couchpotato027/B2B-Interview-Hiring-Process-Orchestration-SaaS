import { CandidatePipelineStatus } from '../entities/CandidatePipelineStatus';

export interface ICandidatePipelineStatusRepository {
  save(status: CandidatePipelineStatus): Promise<void>;
  findById(id: string): Promise<CandidatePipelineStatus | null>;
  findByCandidateId(candidateId: string): Promise<CandidatePipelineStatus | null>;
  findByPipelineId(pipelineId: string): Promise<CandidatePipelineStatus[]>;
  findByStageId(stageId: string): Promise<CandidatePipelineStatus[]>;
  delete(id: string): Promise<void>;
}
