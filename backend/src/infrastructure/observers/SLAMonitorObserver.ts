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
    const resumes = await this.resumeRepository.findByCandidateId(event.payload.candidateId);
    const latestResume = [...resumes].sort(
      (left, right) => right.getUploadedAt().getTime() - left.getUploadedAt().getTime(),
    )[0];

    if (!latestResume) {
      return;
    }

    const elapsedMs =
      event.timestamp.getTime() - latestResume.getUploadedAt().getTime();

    if (elapsedMs > SLAMonitorObserver.SLA_THRESHOLD_MS) {
      logger.warn(
        {
          candidateId: event.payload.candidateId,
          evaluationId: event.payload.evaluationId,
          elapsedHours: Number((elapsedMs / (60 * 60 * 1000)).toFixed(2)),
        },
        'SLA alert: evaluation exceeded 48 hours from resume upload',
      );
    }
  }
}
