import type {
  CandidateCreatedEvent,
  DomainEvent,
  EvaluationCompletedEvent,
} from '../../domain/events/DomainEvents';
import type { IObserver } from '../../domain/observers/IObserver';
import { logger } from '../logging/logger';
import { MetricsStore } from './MetricsStore';

export class DashboardMetricsObserver
  implements IObserver<CandidateCreatedEvent>, IObserver<EvaluationCompletedEvent>
{
  constructor(private readonly metricsStore: MetricsStore = MetricsStore.getInstance()) {}

  public getEventType(): string {
    return '*';
  }

  public async handle(event: DomainEvent): Promise<void> {
    if (event.eventType === 'CandidateCreatedEvent') {
      this.metricsStore.incrementActiveCandidates();
    }

    if (event.eventType === 'EvaluationCompletedEvent') {
      this.metricsStore.incrementEvaluations();
    }

    logger.info(
      {
        eventType: event.eventType,
        metrics: this.metricsStore.getMetrics(),
      },
      'Dashboard metrics updated',
    );
  }

  public getSupportedEventTypes(): string[] {
    return ['CandidateCreatedEvent', 'EvaluationCompletedEvent'];
  }
}
