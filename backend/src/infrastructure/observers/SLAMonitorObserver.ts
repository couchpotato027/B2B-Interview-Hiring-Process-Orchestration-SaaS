import type { EvaluationCompletedEvent } from '../../domain/events/DomainEvents';
import type { IObserver } from '../../domain/observers/IObserver';
import type { IResumeRepository } from '../../domain/repositories/IResumeRepository';
import { logger } from '../logging/logger';

export class SLAMonitorObserver implements IObserver<EvaluationCompletedEvent> {
  private static readonly SLA_THRESHOLD_MS = 48 * 60 * 60 * 1000;

  constructor(private readonly resumeRepository: IResumeRepository) {}

  public getEventType(): string {
    return 'EvaluationCompletedEvent';
  }

  public async handle(event: EvaluationCompletedEvent): Promise<void> {
    const resume = await this.resumeRepository.findByCandidateId(
      event.payload.candidateId, 
      event.payload.organizationId
    );

    if (!resume) {
      return;
    }

    const elapsedMs =
      event.timestamp.getTime() - resume.getUploadedAt().getTime();

    if (elapsedMs > SLAMonitorObserver.SLA_THRESHOLD_MS) {
      logger.warn(
        {
          candidateId: event.payload.candidateId,
          evaluationId: event.payload.evaluationId,
          organizationId: event.payload.organizationId,
          elapsedHours: Number((elapsedMs / (60 * 60 * 1000)).toFixed(2)),
        },
        'SLA alert: evaluation exceeded 48 hours from resume upload',
      );
    }
  }
}
