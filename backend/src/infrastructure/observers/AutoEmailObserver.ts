import { IObserver } from '../../domain/observers/IObserver';
import { CandidateMovedStageEvent } from '../../domain/events/DomainEvents';
import { logger } from '../logging/logger';

export class AutoEmailObserver implements IObserver<CandidateMovedStageEvent> {
  public getEventType(): string {
    return 'CandidateMovedStageEvent';
  }

  public async handle(event: CandidateMovedStageEvent): Promise<void> {
    const { candidateId, toStageId } = event.payload;

    logger.info(
      { candidateId, toStageId },
      'AutoEmailObserver checking for automation triggers'
    );

    // Mock logic for automatic emails
    // In production, we'd fetch stage details to see if automated emails are enabled
    if (toStageId.includes('screening')) {
        logger.info(`[MOCK EMAIL] To Candidate ${candidateId}: "Thanks for applying! Your application is being reviewed."`);
    } else if (toStageId.includes('interview')) {
        logger.info(`[MOCK EMAIL] To Candidate ${candidateId}: "Congratulations! We'd like to invite you for an interview."`);
    }
  }
}
