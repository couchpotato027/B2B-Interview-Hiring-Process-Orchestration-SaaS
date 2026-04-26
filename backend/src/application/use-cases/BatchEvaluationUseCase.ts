import pLimit from 'p-limit';
import { EvaluateCandidateUseCase } from './EvaluateCandidateUseCase';
import type { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import type { IJobRepository } from '../../domain/repositories/IJobRepository';
import type { IAIService } from '../../domain/services/IAIService';
import type { Result } from '../../shared/Result';
import type { Evaluation } from '../../domain/entities/Evaluation';
import { logger } from '../../infrastructure/logging/logger';

export interface BatchEvaluationInput {
  jobId: string;
  candidateIds: string[];
  organizationId: string;
}

export interface BatchEvaluationOutput {
  successful: Evaluation[];
  failed: Array<{
    candidateId: string;
    error: string;
  }>;
}

export class BatchEvaluationUseCase {
  private readonly evaluateCandidateUseCase: EvaluateCandidateUseCase;
  private readonly limit = pLimit(5);

  constructor(dependencies: {
    candidateRepository: ICandidateRepository;
    jobRepository: IJobRepository;
    evaluationRepository: IEvaluationRepository;
    aiService: IAIService;
  }) {
    this.evaluateCandidateUseCase = new EvaluateCandidateUseCase(
      dependencies.candidateRepository,
      dependencies.jobRepository,
      dependencies.evaluationRepository,
      dependencies.aiService
    );
  }

  public async execute(input: BatchEvaluationInput): Promise<Result<BatchEvaluationOutput>> {
    logger.info(
      { jobId: input.jobId, count: input.candidateIds.length },
      'Starting batch evaluation'
    );

    const tasks = input.candidateIds.map((candidateId) =>
      this.limit(async () => {
        try {
          const result = await this.evaluateCandidateUseCase.execute({
            candidateId,
            jobId: input.jobId,
            organizationId: input.organizationId,
          });

          return { candidateId, result };
        } catch (error) {
          return {
            candidateId,
            result: {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              code: 'BATCH_ITEM_FAILED',
            } as Result<Evaluation>,
          };
        }
      })
    );

    const finalResults = await Promise.all(tasks);

    const successful: Evaluation[] = [];
    const failed: Array<{ candidateId: string; error: string }> = [];

    for (const { candidateId, result } of finalResults) {
      if (result.success) {
        successful.push(result.data);
      } else {
        failed.push({ candidateId, error: result.error });
      }
    }

    logger.info(
      {
        jobId: input.jobId,
        successful: successful.length,
        failed: failed.length,
      },
      'Batch evaluation completed'
    );

    return {
      success: true,
      data: {
        successful,
        failed,
      },
    };
  }
}
