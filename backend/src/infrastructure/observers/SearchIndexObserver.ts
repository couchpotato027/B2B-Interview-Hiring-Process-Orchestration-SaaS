import { IObserver } from '../../domain/observers/IObserver';
import { DomainEvent, CandidateCreatedEvent, ResumeProcessedEvent, CandidateMovedStageEvent } from '../../domain/events/DomainEvents';
import { ISearchService } from '../../domain/services/ISearchService';
import { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { IResumeRepository } from '../../domain/repositories/IResumeRepository';
import { ICandidatePipelineStatusRepository } from '../../domain/repositories/ICandidatePipelineStatusRepository';
import { logger } from '../logging/logger';

export class SearchIndexObserver implements IObserver<DomainEvent> {
  constructor(
    private readonly searchService: ISearchService,
    private readonly candidateRepository: ICandidateRepository,
    private readonly resumeRepository: IResumeRepository,
    private readonly pipelineStatusRepository: ICandidatePipelineStatusRepository
  ) {}

  public getEventType(): string {
    return 'CandidateCreatedEvent'; 
  }

  public async handle(event: DomainEvent): Promise<void> {
    try {
      if (event.eventType === 'CandidateCreatedEvent') {
        const payload = (event as CandidateCreatedEvent).payload;
        await this.indexCandidate(payload.candidateId, payload.organizationId);
      } else if (event.eventType === 'ResumeProcessedEvent') {
        const payload = (event as ResumeProcessedEvent).payload;
        await this.indexCandidate(payload.candidateId, payload.organizationId);
      } else if (event.eventType === 'CandidateMovedStageEvent') {
        const payload = (event as CandidateMovedStageEvent).payload;
        await this.indexCandidate(payload.candidateId, payload.organizationId);
      }
    } catch (error) {
      logger.error(`Failed to index candidate for search: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async indexCandidate(candidateId: string, organizationId: string): Promise<void> {
    const candidate = await this.candidateRepository.findById(candidateId, organizationId);
    if (!candidate) return;

    const resume = await this.resumeRepository.findByCandidateId(candidateId, organizationId);
    const pipelineStatus = await this.pipelineStatusRepository.findByCandidateId(candidateId, organizationId);

    await this.searchService.indexCandidate(candidate, resume || undefined, pipelineStatus || undefined);
    logger.info(`Updated search index for candidate ${candidateId}.`);
  }
}
