import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import type { IResumeRepository } from '../../domain/repositories/IResumeRepository';
import type { IAIService } from '../../domain/services/IAIService';
import type { Result } from '../../shared/Result';
import type { ResumeFeedback } from '../../domain/types/AITypes';
import { logger } from '../../infrastructure/logging/logger';

export class ResumeFeedbackUseCase {
  constructor(
    private readonly candidateRepository: ICandidateRepository,
    private readonly resumeRepository: IResumeRepository,
    private readonly aiService: IAIService
  ) {}

  public async execute(input: { candidateId: string }): Promise<Result<ResumeFeedback>> {
    try {
      const candidate = await this.candidateRepository.findById(input.candidateId);
      if (!candidate) {
        return { success: false, error: 'Candidate not found', code: 'CANDIDATE_NOT_FOUND' };
      }

      // We need to fetch the resume content. Candidate entity has resumeId.
      const resumeId = candidate.getResumeId();
      if (!resumeId) {
        return { success: false, error: 'No resume found for this candidate', code: 'RESUME_NOT_FOUND' };
      }

      const resume = await this.resumeRepository.findById(resumeId);
      if (!resume) {
        return { success: false, error: 'Resume record not found', code: 'RESUME_RECORD_NOT_FOUND' };
      }

      logger.info({ candidateId: input.candidateId, resumeId }, 'Generating resume feedback');

      const feedback = await this.aiService.generateResumeFeedback(resume);

      return {
        success: true,
        data: feedback,
      };
    } catch (error) {
      logger.error({ err: error }, 'Resume feedback generation failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Feedback failed',
        code: 'FEEDBACK_GENERATION_FAILED',
      };
    }
  }
}
