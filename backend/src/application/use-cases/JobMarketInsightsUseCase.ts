import type { IJobRepository } from '../../domain/repositories/IJobRepository';
import type { IAIService } from '../../domain/services/IAIService';
import type { Result } from '../../shared/Result';
import type { MarketInsights } from '../../domain/types/AITypes';
import { logger } from '../../infrastructure/logging/logger';

export class JobMarketInsightsUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly aiService: IAIService
  ) {}

  public async execute(input: { jobId: string }): Promise<Result<MarketInsights>> {
    try {
      const job = await this.jobRepository.findById(input.jobId);
      if (!job) {
        return { success: false, error: 'Job not found', code: 'JOB_NOT_FOUND' };
      }

      logger.info({ jobId: input.jobId }, 'Generating job market insights');

      const insights = await this.aiService.generateJobMarketInsights(job);

      return {
        success: true,
        data: insights,
      };
    } catch (error) {
      logger.error({ err: error }, 'Job market insights generation failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Insights failed',
        code: 'INSIGHT_GENERATION_FAILED',
      };
    }
  }
}
