import { IJobRepository } from '../../domain/repositories/IJobRepository';
import { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import { AnalyticsService } from '../services/AnalyticsService';
import { NotFoundError } from '../../shared/errors/NotFoundError';

export interface JobReport {
  jobTitle: string;
  totalCandidates: number;
  averageEvaluationScore: number;
  topCandidates: Array<{ id: string; name: string; score: number }>;
  funnel: any;
}

export class GenerateJobReportUseCase {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly candidateRepository: ICandidateRepository,
    private readonly analyticsService: AnalyticsService
  ) {}

  async execute(jobId: string): Promise<JobReport> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');

    const evaluations = await this.evaluationRepository.findByJobId(jobId);
    const avgScore = evaluations.length > 0
      ? evaluations.reduce((acc, e) => acc + e.getOverallScore(), 0) / evaluations.length
      : 0;

    const topEvaluations = [...evaluations]
      .sort((a, b) => b.getOverallScore() - a.getOverallScore())
      .slice(0, 5);

    const topCandidates = await Promise.all(
      topEvaluations.map(async (e) => {
        const candidate = await this.candidateRepository.findById(e.getCandidateId());
        return {
          id: e.getCandidateId(),
          name: candidate?.getName() || 'Unknown',
          score: e.getOverallScore()
        };
      })
    );

    return {
      jobTitle: job.getTitle(),
      totalCandidates: evaluations.length,
      averageEvaluationScore: Number(avgScore.toFixed(2)),
      topCandidates,
      funnel: {} // Would call calculateConversionFunnel if pipelineId was attached to Job
    };
  }
}
