import { IInterviewRepository } from '../../domain/repositories/IInterviewRepository';
import { Result } from '../../shared/Result';
import { InterviewFeedback } from '../../domain/entities/Interview';
import { EventEmitter } from '../../infrastructure/events/EventEmitter';
import { prisma } from '../../infrastructure/database/prisma.client';

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
      // 1. Find the interview
      const interview = await this.interviewRepository.findById(input.interviewId, input.tenantId);
      if (!interview) return { success: false, error: 'Interview not found', code: 'INTERVIEW_NOT_FOUND' };

      // 2. Complete the interview with feedback
      interview.complete(input.feedback);
      await this.interviewRepository.update(interview);

      // 3. Emit domain event
      await this.eventEmitter.emit({
        eventType: 'InterviewFeedbackSubmittedEvent',
        timestamp: new Date(),
        payload: {
          interviewId: interview.getId(),
          candidateId: interview.getCandidateId(),
          tenantId: interview.getTenantId(),
          recommendation: input.feedback.recommendation,
        },
      });

      // 4. Auto-decision logic based on feedback
      await this.processAutoDecision(
        interview.getCandidateId(),
        input.tenantId,
        input.feedback.recommendation,
      );

      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: error.message, code: 'INTERNAL_ERROR' };
    }
  }

  /**
   * Auto-decision logic:
   * - If recommendation is 'strong_no_hire': auto-reject the candidate
   * - If recommendation is 'strong_hire': check if ALL interviews for candidate have
   *   strong_hire/hire — if so, auto-set candidate to HIRED status
   * - Otherwise: create a notification suggesting review
   */
  private async processAutoDecision(
    candidateId: string,
    tenantId: string,
    recommendation: string,
  ): Promise<void> {
    try {
      const candidate = await prisma.candidate.findFirst({
        where: { id: candidateId, tenantId },
        select: { id: true, firstName: true, lastName: true, status: true },
      });

      if (!candidate || candidate.status === 'HIRED' || candidate.status === 'REJECTED') {
        return; // Don't change already-decided candidates
      }

      if (recommendation === 'strong_no_hire') {
        // Auto-reject on strong no-hire
        await prisma.candidate.update({
          where: { id: candidateId },
          data: {
            status: 'REJECTED',
            stageHistory: {
              push: {
                action: 'AUTO_REJECTED',
                reason: 'Strong no-hire recommendation from interviewer',
                at: new Date().toISOString(),
                by: 'system',
              },
            } as any,
          },
        });

        // Create notification for recruiters
        const recruiters = await prisma.user.findMany({
          where: { tenantId, role: { name: { in: ['ADMIN', 'RECRUITER'] } } },
          select: { id: true },
        });

        for (const recruiter of recruiters) {
          await prisma.notification.create({
            data: {
              tenantId,
              userId: recruiter.id,
              type: 'AUTO_DECISION',
              title: 'Candidate Auto-Rejected',
              message: `${candidate.firstName} ${candidate.lastName} was auto-rejected due to a strong no-hire recommendation.`,
            },
          });
        }
      } else if (recommendation === 'strong_hire' || recommendation === 'hire') {
        // Check if all completed interviews recommend hire
        const allInterviews = await prisma.interview.findMany({
          where: { candidateId, tenantId, status: 'COMPLETED' },
          select: { feedback: true },
        });

        if (allInterviews.length === 0) return;

        const allPositive = allInterviews.every((iv) => {
          const fb = iv.feedback as any;
          return fb?.recommendation === 'strong_hire' || fb?.recommendation === 'hire';
        });

        if (allPositive && allInterviews.length >= 1) {
          // Notify recruiters that candidate is ready for hiring decision
          const recruiters = await prisma.user.findMany({
            where: { tenantId, role: { name: { in: ['ADMIN', 'RECRUITER'] } } },
            select: { id: true },
          });

          for (const recruiter of recruiters) {
            await prisma.notification.create({
              data: {
                tenantId,
                userId: recruiter.id,
                type: 'HIRE_SUGGESTION',
                title: 'Hire Recommendation',
                message: `All ${allInterviews.length} interviewers recommend hiring ${candidate.firstName} ${candidate.lastName}. Review and make a final decision.`,
              },
            });
          }
        }
      } else if (recommendation === 'no_hire') {
        // Create a review notification — don't auto-reject on regular no_hire
        const recruiters = await prisma.user.findMany({
          where: { tenantId, role: { name: { in: ['ADMIN', 'RECRUITER'] } } },
          select: { id: true },
        });

        for (const recruiter of recruiters) {
          await prisma.notification.create({
            data: {
              tenantId,
              userId: recruiter.id,
              type: 'REVIEW_NEEDED',
              title: 'Negative Feedback Received',
              message: `${candidate.firstName} ${candidate.lastName} received a no-hire recommendation. Please review and decide.`,
            },
          });
        }
      }
    } catch (error) {
      // Auto-decision is best-effort — don't fail the feedback submission
      console.error('Auto-decision processing failed:', error);
    }
  }
}
