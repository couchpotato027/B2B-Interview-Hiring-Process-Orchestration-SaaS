import { IObserver } from '../../domain/observers/IObserver';
import { CandidateMovedStageEvent } from '../../domain/events/DomainEvents';
import { logger } from '../logging/logger';
import { prisma } from '../database/prisma.client';

export class StageTransitionObserver implements IObserver<CandidateMovedStageEvent> {
  public getEventType(): string {
    return 'CandidateMovedStageEvent';
  }

  public async handle(event: CandidateMovedStageEvent): Promise<void> {
    const { candidateId, pipelineId, fromStageId, toStageId, movedBy, organizationId } = event.payload;

    logger.info(
      { candidateId, pipelineId, fromStageId, toStageId, movedBy },
      'Candidate transition logged'
    );

    try {
      await prisma.auditLog.create({
        data: {
          tenantId: organizationId,
          userId: movedBy.includes('@') ? null : movedBy, // userId expected in schema is UUID if UUID but some might pass email
          action: 'CANDIDATE_MOVED_STAGE',
          entityType: 'Candidate',
          entityId: candidateId,
          metadata: {
            fromStageId,
            toStageId,
            pipelineId,
          },
        },
      });
    } catch (error) {
      logger.error(error, 'Failed to create audit log for stage transition');
    }
  }
}
