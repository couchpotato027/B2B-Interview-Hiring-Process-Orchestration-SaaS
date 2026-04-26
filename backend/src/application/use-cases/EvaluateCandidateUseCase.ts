import { randomUUID } from 'crypto';
import { Evaluation, EvaluationRecommendation } from '../../domain/entities/Evaluation';
import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import type { IJobRepository } from '../../domain/repositories/IJobRepository';
import type { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import type { IAIService } from '../../domain/services/IAIService';
import { ScoringService } from '../services/ScoringService';
import { Result } from '../../shared/Result';

export interface EvaluateCandidateInput {
  candidateId: string;
  jobId: string;
  organizationId: string;
}

export class EvaluateCandidateUseCase {
  private readonly scoringService: ScoringService;

  constructor(
    private readonly candidateRepository: ICandidateRepository,
    private readonly jobRepository: IJobRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly aiService: IAIService
  ) {
    this.scoringService = new ScoringService();
  }

  public async execute(input: EvaluateCandidateInput): Promise<Result<Evaluation>> {
    try {
      // 1. Fetch Candidate and Job
      const [candidate, job] = await Promise.all([
        this.candidateRepository.findById(input.candidateId, input.organizationId),
        this.jobRepository.findById(input.jobId, input.organizationId)
      ]);

      if (!candidate) return { success: false, error: 'Candidate not found', code: 'CANDIDATE_NOT_FOUND' };
      if (!job) return { success: false, error: 'Job not found', code: 'JOB_NOT_FOUND' };

      // 2. Calculate scores using ScoringService (Deterministic logic)
      const scores = this.scoringService.calculateScores(candidate, job);

      // 3. Get AI insights (Gemini)
      // Note: GeminiAIService has built-in fallbacks
      const aiInsights = await this.aiService.generateCandidateInsights(candidate, job, {
        overallScore: scores.overallScore,
        strategies: [
          { name: 'Skill Match', score: scores.skillMatchScore, weight: 0.4 },
          { name: 'Experience', score: scores.experienceScore, weight: 0.3 },
          { name: 'Project Relevance', score: scores.projectRelevanceScore, weight: 0.3 }
        ]
      });

      // 4. Create Evaluation Entity
      // Reuse existing evaluation ID if it exists to allow upsert
      const existingEval = await this.evaluationRepository.findByCandidateAndJob(
        candidate.getId(),
        job.getId(),
        input.organizationId
      );

      const evaluation = new Evaluation({
        id: existingEval ? existingEval.getId() : randomUUID(),
        candidateId: candidate.getId(),
        jobId: job.getId(),
        skillMatchScore: scores.skillMatchScore,
        experienceScore: scores.experienceScore,
        projectRelevanceScore: scores.projectRelevanceScore,
        overallScore: scores.overallScore,
        strengths: aiInsights.strengths,
        weaknesses: aiInsights.weaknesses,
        missingSkills: aiInsights.missingSkills,
        recommendation: aiInsights.recommendation as EvaluationRecommendation,
        summary: aiInsights.summary,
        organizationId: input.organizationId,
        evaluatedAt: new Date()
      });

      // 5. Persist
      const savedEvaluation = await this.evaluationRepository.save(evaluation);

      return {
        success: true,
        data: savedEvaluation
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Evaluation failed',
        code: 'EVALUATION_ERROR'
      };
    }
  }
}
