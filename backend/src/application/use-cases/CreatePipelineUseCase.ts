import { v4 as uuidv4 } from 'uuid';
import { Pipeline } from '../../domain/entities/Pipeline';
import { PipelineStage, PipelineStageType } from '../../domain/entities/PipelineStage';
import { IPipelineRepository } from '../../domain/repositories/IPipelineRepository';
import { PipelineCreatedEvent } from '../../domain/events/DomainEvents';
import { EventEmitter } from '../../infrastructure/events/EventEmitter';

export interface CreatePipelineInput {
  name: string;
  jobId: string;
  organizationId: string;
  stages: Array<{
    name: string;
    type: PipelineStageType;
  }>;
}

export class CreatePipelineUseCase {
  constructor(
    private readonly pipelineRepository: IPipelineRepository,
    private readonly eventEmitter: EventEmitter
  ) {}

  async execute(input: CreatePipelineInput): Promise<Pipeline> {
    const pipelineId = uuidv4();
    
    const stages = input.stages.map((s, index) => {
      return new PipelineStage({
        id: uuidv4(),
        name: s.name,
        order: index,
        type: s.type,
      });
    });

    const pipeline = new Pipeline({
      id: pipelineId,
      name: input.name,
      jobId: input.jobId,
      organizationId: input.organizationId,
      stages,
      isActive: true,
      createdAt: new Date(),
    });

    await this.pipelineRepository.save(pipeline);

    await this.eventEmitter.emit({
      eventType: 'PipelineCreatedEvent',
      timestamp: new Date(),
      payload: {
        pipelineId,
        organizationId: input.organizationId,
        jobId: input.jobId,
        name: input.name,
        timestamp: new Date(),
      },
    } as PipelineCreatedEvent);

    return pipeline;
  }
}
