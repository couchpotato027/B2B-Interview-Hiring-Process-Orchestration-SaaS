import { IObserver } from '../../domain/observers/IObserver';
import { DomainEvent } from '../../domain/events/DomainEvents';
import { cacheService } from '../cache/CacheService';
import { logger } from '../logging/logger';

export class AnalyticsCacheObserver implements IObserver<DomainEvent> {
  private readonly DASHBOARD_CACHE_KEY = 'hiring_dashboard_metrics';

  public getEventType(): string {
    return 'ALL'; // Custom handling
  }

  public getSupportedEventTypes(): string[] {
    return [
      'CandidateCreatedEvent',
      'CandidateMovedStageEvent',
      'EvaluationCompletedEvent',
      'ResumeProcessedEvent'
    ];
  }

  public async handle(event: DomainEvent): Promise<void> {
    logger.info({ eventType: event.eventType }, 'Invalidating analytics cache due to domain event');
    
    // Invalidate the main dashboard cache when any relevant data changes
    cacheService.delete(this.DASHBOARD_CACHE_KEY);
    
    // Invalidate job-specific reports if jobId is in payload
    const payload = event.payload as any;
    if (payload.jobId) {
        cacheService.delete(`job_report:${payload.jobId}`);
    }
  }
}
