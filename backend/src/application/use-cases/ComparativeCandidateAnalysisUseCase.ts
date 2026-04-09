import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import type { IJobRepository } from '../../domain/repositories/IJobRepository';
import type { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import type { IAIService } from '../../domain/services/IAIService';
import type { Result } from '../../shared/Result';
import type { ComparativeInsights } from '../../domain/types/AITypes';
import { logger } from '../../infrastructure/logging/logger';

export interface ComparativeAnalysisInput {
  jobId: string;
  candidateIds: string[];
}

export class ComparativeCandidateAnalysisUseCase {
  constructor(
    private readonly candidateRepository: ICandidateRepository,
    private readonly jobRepository: IJobRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly aiService: IAIService
  ) {}

  public async execute(input: ComparativeAnalysisInput): Promise<Result<ComparativeInsights>> {
    try {
      const job = await this.jobRepository.findById(input.jobId);
      if (!job) {
        return { success: false, error: 'Job not found', code: 'JOB_NOT_FOUND' };
      }

      const candidates = await Promise.all(
        input.candidateIds.map(id => this.candidateRepository.findById(id))
      );
      
      const validCandidates = candidates.filter((c): c is any => c !== null);
      if (validCandidates.length < 2) {
        return { success: false, error: 'At least 2 valid candidates are required for comparison.', code: 'INSUFFICIENT_CANDIDATES' };
      }

      const evaluations = await Promise.all(
        input.candidateIds.map(id => this.evaluationRepository.findByCandidateAndJob(id, input.jobId))
      );

      const validEvaluations = evaluations.filter((e): e is any => e !== null);
      if (validEvaluations.length < 2) {
        return { success: false, error: 'Evaluations for at least 2 candidates are required.', code: 'INSUFFICIENT_EVALUATIONS' };
      }

      logger.info({ jobId: input.jobId, count: validCandidates.length }, 'Generating comparative analysis');

      const insights = await this.aiService.generateComparativeAnalysis(
        validEvaluations,
        validCandidates,
        job
      );

      return {
        success: true,
        data: insights,
      };
    } catch (error) {
      logger.error({ err: error }, 'Comparative analysis failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Comparison failed',
        code: 'COMPARISON_FAILED',
      };
    }
  }
}
