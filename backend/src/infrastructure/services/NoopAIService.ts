import type { Candidate } from '../../domain/entities/Candidate';
import type { Job } from '../../domain/entities/Job';
import type { Resume } from '../../domain/entities/Resume';
import type { Evaluation } from '../../domain/entities/Evaluation';
import type { IAIService } from '../../domain/services/IAIService';
import type {
  CandidateInsights,
  FitEvaluation,
  Project,
  ProjectAnalysis,
  ComparativeInsights,
  MarketInsights,
  ResumeFeedback,
} from '../../domain/types/AITypes';
import type { ScoreBreakdown } from '../../domain/types/ScoringTypes';

export class NoopAIService implements IAIService {
  public async extractSkillsFromResume(): Promise<string[]> {
    return [];
  }

  public async analyzeProjectRelevance(
    projects: Project[],
    _requiredSkills: string[],
  ): Promise<ProjectAnalysis[]> {
    return projects.map((project) => ({
      projectTitle: project.title,
      relevanceScore: 0,
      matchingSkills: [],
      reasoning: 'AI service is disabled in the current environment.',
    }));
  }

  public async generateCandidateInsights(
    _candidate: Candidate,
    _job: Job,
    _scores: ScoreBreakdown,
  ): Promise<CandidateInsights> {
    return {
      strengths: [],
      weaknesses: [],
      missingSkills: [],
      recommendation: 'consider',
      summary: 'AI-generated insights are unavailable in the current environment.',
    };
  }

  public async evaluateCandidateFit(_candidate: Candidate, _job: Job): Promise<FitEvaluation> {
    return {
      fitScore: 0,
      reasoning: 'AI-generated fit evaluation is unavailable in the current environment.',
      keyPoints: ['Claude API key is not configured.'],
    };
  }

  public async generateComparativeAnalysis(
    evaluations: Evaluation[],
    candidates: Candidate[],
    job: Job
  ): Promise<ComparativeInsights> {
    return {
      strongestCandidateId: '',
      rankings: [],
      skillGapAnalysis: 'AI analysis unavailable.',
      summary: 'Comparison data is currently not processed by AI.'
    };
  }

  public async generateJobMarketInsights(_job: Job): Promise<MarketInsights> {
    return {
      skillDemand: [],
      suggestedSalaryRange: { min: 0, max: 0, currency: 'USD' },
      similarJobTitles: [],
      interviewQuestions: []
    };
  }

  public async generateResumeFeedback(_resume: Resume): Promise<ResumeFeedback> {
    return {
      strengths: [],
      improvements: [],
      missingKeywords: [],
      formattingSuggestions: [],
      overallScore: 0
    };
  }
}
