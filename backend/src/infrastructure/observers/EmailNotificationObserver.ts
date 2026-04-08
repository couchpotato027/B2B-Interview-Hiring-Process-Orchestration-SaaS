import type { EvaluationCompletedEvent } from '../../domain/events/DomainEvents';
import type { IObserver } from '../../domain/observers/IObserver';
import { logger } from '../logging/logger';

export class EmailNotificationObserver
  implements IObserver<EvaluationCompletedEvent>
{
  public getEventType(): string {
    return 'EvaluationCompletedEvent';
  }

  public async handle(event: EvaluationCompletedEvent): Promise<void> {
    logger.info(
      {
        candidateId: event.payload.candidateId,
        evaluationId: event.payload.evaluationId,
        jobId: event.payload.jobId,
      },
      'Email sent to recruiter about candidate evaluation',
    );
  }
}
