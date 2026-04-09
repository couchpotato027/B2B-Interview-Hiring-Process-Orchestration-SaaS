import { IObserver } from '../../domain/observers/IObserver';
import { CandidateMovedStageEvent } from '../../domain/events/DomainEvents';
import { logger } from '../logging/logger';

export class StageTransitionObserver implements IObserver<CandidateMovedStageEvent> {
  public getEventType(): string {
    return 'CandidateMovedStageEvent';
  }

  public async handle(event: CandidateMovedStageEvent): Promise<void> {
    const { candidateId, pipelineId, fromStageId, toStageId, movedBy } = event.payload;

    logger.info(
      {
        candidateId,
        pipelineId,
        fromStageId,
        toStageId,
        movedBy,
      },
      'Candidate transition logged in StageTransitionObserver'
    );

    // In a real system, we might save this to an audit log table in the DB
  }
}
