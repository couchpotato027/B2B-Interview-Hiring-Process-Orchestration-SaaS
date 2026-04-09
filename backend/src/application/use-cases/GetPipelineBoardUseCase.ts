import { IPipelineRepository } from '../../domain/repositories/IPipelineRepository';
import { ICandidatePipelineStatusRepository } from '../../domain/repositories/ICandidatePipelineStatusRepository';
import { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { Pipeline } from '../../domain/entities/Pipeline';
import { NotFoundError } from '../../shared/errors/NotFoundError';

export interface PipelineBoardData {
  pipeline: Pipeline;
  stages: Array<{
    stageId: string;
    stageName: string;
    candidates: Array<{
      id: string;
      name: string;
      email: string;
      timeInStage: number;
      notes?: string;
    }>;
  }>;
}

export class GetPipelineBoardUseCase {
  constructor(
    private readonly pipelineRepository: IPipelineRepository,
    private readonly statusRepository: ICandidatePipelineStatusRepository,
    private readonly candidateRepository: ICandidateRepository
  ) {}

  async execute(pipelineId: string): Promise<PipelineBoardData> {
    const pipeline = await this.pipelineRepository.findById(pipelineId);
    if (!pipeline) {
      throw new NotFoundError(`Pipeline with ID ${pipelineId} not found`);
    }

    const stages = pipeline.getStages();
    const boardStages = [];

    for (const stage of stages) {
      const statuses = await this.statusRepository.findByStageId(stage.getId());
      const stageCandidates = [];

      for (const status of statuses) {
        const candidate = await this.candidateRepository.findById(status.getCandidateId());
        if (candidate) {
          stageCandidates.push({
            id: candidate.getId(),
            name: candidate.getName(),
            email: candidate.getEmail(),
            timeInStage: status.getTimeInCurrentStage(),
            notes: status.getNotes(),
          });
        }
      }

      boardStages.push({
        stageId: stage.getId(),
        stageName: stage.getName(),
        candidates: stageCandidates,
      });
    }

    return {
      pipeline,
      stages: boardStages,
    };
  }
}
