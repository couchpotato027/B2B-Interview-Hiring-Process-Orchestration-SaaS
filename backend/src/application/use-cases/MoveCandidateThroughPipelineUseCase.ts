import { v4 as uuidv4 } from 'uuid';
import { ICandidatePipelineStatusRepository } from '../../domain/repositories/ICandidatePipelineStatusRepository';
import { IPipelineRepository } from '../../domain/repositories/IPipelineRepository';
import { CandidatePipelineStatus } from '../../domain/entities/CandidatePipelineStatus';
import { CandidateMovedStageEvent } from '../../domain/events/DomainEvents';
import { EventEmitter } from '../../infrastructure/events/EventEmitter';
import { NotFoundError } from '../../shared/errors/NotFoundError';

export interface MoveCandidateInput {
  candidateId: string;
  pipelineId: string;
  newStageId: string;
  organizationId: string;
  movedBy: string;
  reason?: string;
  notes?: string;
}

export class MoveCandidateThroughPipelineUseCase {
  constructor(
    private readonly statusRepository: ICandidatePipelineStatusRepository,
    private readonly pipelineRepository: IPipelineRepository,
    private readonly eventEmitter: EventEmitter
  ) {}

  async execute(input: MoveCandidateInput): Promise<CandidatePipelineStatus> {
    const pipeline = await this.pipelineRepository.findById(input.pipelineId, input.organizationId);
    if (!pipeline) {
      throw new NotFoundError(`Pipeline with ID ${input.pipelineId} not found`);
    }

    const stage = pipeline.getStageById(input.newStageId);
    if (!stage) {
      throw new NotFoundError(`Stage with ID ${input.newStageId} not found in pipeline ${input.pipelineId}`);
    }

    let status = await this.statusRepository.findByCandidateId(input.candidateId, input.organizationId);
    let fromStageId: string | null = null;

    if (!status) {
      status = new CandidatePipelineStatus({
        id: uuidv4(),
        candidateId: input.candidateId,
        pipelineId: input.pipelineId,
        organizationId: input.organizationId,
        currentStageId: input.newStageId,
        stageHistory: [],
        notes: input.notes,
        updatedAt: new Date(),
      });
    } else {
      fromStageId = status.getCurrentStageId();
      status.moveToStage(input.newStageId, input.movedBy, input.reason, input.notes);
    }

    await this.statusRepository.save(status);

    await this.eventEmitter.emit({
      eventType: 'CandidateMovedStageEvent',
      timestamp: new Date(),
      payload: {
        candidateId: input.candidateId,
        organizationId: input.organizationId,
        pipelineId: input.pipelineId,
        fromStageId,
        toStageId: input.newStageId,
        movedBy: input.movedBy,
        timestamp: new Date(),
      },
    } as CandidateMovedStageEvent);

    return status;
  }
}
