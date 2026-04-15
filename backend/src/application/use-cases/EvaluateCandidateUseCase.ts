import { randomUUID } from 'crypto';
import { Evaluation } from '../../domain/entities/Evaluation';
import type { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import type { IJobRepository } from '../../domain/repositories/IJobRepository';
import type { IAIService } from '../../domain/services/IAIService';
import type { EvaluationCompletedEvent } from '../../domain/events/DomainEvents';
import { EventEmitter } from '../../infrastructure/events/EventEmitter';
import { CandidateScorer } from '../services/CandidateScorer';
import { ScoringStrategyFactory } from '../strategies/ScoringStrategyFactory';
import type { Result } from '../../shared/Result';

export interface EvaluateCandidateInput {
  candidateId: string;
  jobId: string;
  organizationId: string;
}

export interface EvaluateCandidateDependencies {
  candidateRepository: ICandidateRepository;
  jobRepository: IJobRepository;
  evaluationRepository: IEvaluationRepository;
  aiService: IAIService;
  eventEmitter?: EventEmitter;
}

export class EvaluateCandidateUseCase {
  private readonly eventEmitter: EventEmitter;

  constructor(private readonly dependencies: EvaluateCandidateDependencies) {
    this.eventEmitter = dependencies.eventEmitter ?? EventEmitter.getInstance();
  }

  public async execute(input: EvaluateCandidateInput): Promise<Result<Evaluation>> {
    const candidate = await this.dependencies.candidateRepository.findById(input.candidateId, input.organizationId);
    if (!candidate) {
      return {
        success: false,
        error: `Candidate ${input.candidateId} not found.`,
        code: 'CANDIDATE_NOT_FOUND',
      };
    }

    const job = await this.dependencies.jobRepository.findById(input.jobId, input.organizationId);
    if (!job) {
      return {
        success: false,
        error: `Job ${input.jobId} not found.`,
        code: 'JOB_NOT_FOUND',
      };
    }

    try {
      const scorer = new CandidateScorer(ScoringStrategyFactory.getDefaultStrategies());
      const scores = await scorer.calculateScore(candidate, job);
      const insights = await this.dependencies.aiService.generateCandidateInsights(
        candidate,
        job,
        scores,
      );

      const scoreMap = new Map(scores.strategies.map((strategy) => [strategy.name, strategy.score]));

      const evaluation = new Evaluation({
        id: randomUUID(),
        candidateId: candidate.getId(),
        jobId: job.getId(),
        skillMatchScore: scoreMap.get('Skill Match') ?? 0,
        experienceScore: scoreMap.get('Experience Match') ?? 0,
        projectRelevanceScore: scoreMap.get('Project Relevance') ?? 0,
        strengths: insights.strengths,
        weaknesses: insights.weaknesses,
        recommendation: this.mapRecommendation(insights.recommendation),
        organizationId: input.organizationId,
        evaluatedAt: new Date(),
      });

      const savedEvaluation = await this.dependencies.evaluationRepository.save(evaluation);

      const evaluationCompletedEvent: EvaluationCompletedEvent = {
        eventType: 'EvaluationCompletedEvent',
        timestamp: new Date(),
        payload: {
          evaluationId: savedEvaluation.getId(),
          candidateId: savedEvaluation.getCandidateId(),
          organizationId: input.organizationId,
          jobId: savedEvaluation.getJobId(),
          overallScore: savedEvaluation.getOverallScore(),
          timestamp: new Date(),
        },
      };

      await this.eventEmitter.emit(evaluationCompletedEvent);

      return {
        success: true,
        data: savedEvaluation,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to evaluate candidate.',
        code: 'EVALUATION_FAILED',
      };
    }
  }

  private mapRecommendation(
    recommendation: string,
  ): 'highly_recommended' | 'recommended' | 'consider' | 'not_recommended' {
    const allowedRecommendations = new Set([
      'highly_recommended',
      'recommended',
      'consider',
      'not_recommended',
    ]);

    return allowedRecommendations.has(recommendation)
      ? (recommendation as 'highly_recommended' | 'recommended' | 'consider' | 'not_recommended')
      : 'consider';
  }
}
