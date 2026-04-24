import { IInterviewRepository } from '../../domain/repositories/IInterviewRepository';
import { Result } from '../../shared/Result';
import { InterviewFeedback } from '../../domain/entities/Interview';
import { EventEmitter } from '../../infrastructure/events/EventEmitter';

export interface SubmitFeedbackInput {
  interviewId: string;
  feedback: InterviewFeedback;
  tenantId: string;
}

export class SubmitFeedbackUseCase {
  constructor(
    private readonly interviewRepository: IInterviewRepository,
    private readonly eventEmitter: EventEmitter = EventEmitter.getInstance()
  ) {}

  async execute(input: SubmitFeedbackInput): Promise<Result<void>> {
    try {
      const interview = await this.interviewRepository.findById(input.interviewId, input.tenantId);
      if (!interview) return { success: false, error: 'Interview not found', code: 'INTERVIEW_NOT_FOUND' };

      interview.complete(input.feedback);
      await this.interviewRepository.update(interview);

      await this.eventEmitter.emit({
        eventType: 'InterviewFeedbackSubmittedEvent',
        timestamp: new Date(),
        payload: {
          interviewId: interview.getId(),
          candidateId: interview.getCandidateId(),
          tenantId: interview.getTenantId(),
          recommendation: input.feedback.recommendation
        }
      });

      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: error.message, code: 'INTERNAL_ERROR' };
    }
  }
}
