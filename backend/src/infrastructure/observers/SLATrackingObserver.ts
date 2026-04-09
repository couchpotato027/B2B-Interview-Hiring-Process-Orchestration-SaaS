import { IObserver } from '../../domain/observers/IObserver';
import { CandidateMovedStageEvent } from '../../domain/events/DomainEvents';
import { logger } from '../logging/logger';

export class SLATrackingObserver implements IObserver<CandidateMovedStageEvent> {
  public getEventType(): string {
    return 'CandidateMovedStageEvent';
  }

  public async handle(event: CandidateMovedStageEvent): Promise<void> {
    const { candidateId, toStageId, timestamp } = event.payload;

    logger.info(
      { candidateId, toStageId, timestamp },
      'SLATrackingObserver initialized monitor for stage entry'
    );

    // In a real system, we'd schedule a background job (e.g., BullMQ)
    // to check after X days if the candidate is still in this stage.
    // If they are, fire an alert.
  }
}
