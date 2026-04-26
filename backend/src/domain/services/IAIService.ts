import type { Candidate } from '../entities/Candidate';
import type { Job } from '../entities/Job';
import type { Resume } from '../entities/Resume';
import type { Evaluation } from '../entities/Evaluation';
import type {
  CandidateInsights,
  FitEvaluation,
  Project,
  ProjectAnalysis,
  ComparativeInsights,
  MarketInsights,
  ResumeFeedback,
} from '../types/AITypes';
import type { ScoreBreakdown } from '../types/ScoringTypes';

export interface IAIService {
  extractSkillsFromResume(resumeText: string): Promise<string[]>;
  analyzeProjectRelevance(
    projects: Project[],
    requiredSkills: string[],
  ): Promise<ProjectAnalysis[]>;
  generateCandidateInsights(
    candidate: Candidate,
    job: Job,
    scores: ScoreBreakdown,
  ): Promise<CandidateInsights>;
  evaluateCandidateFit(candidate: Candidate, job: Job): Promise<FitEvaluation>;
  
  // New Advanced Methods
  generateComparativeAnalysis(evaluations: Evaluation[], candidates: Candidate[], job: Job): Promise<ComparativeInsights>;
  generateJobMarketInsights(job: Job): Promise<MarketInsights>;
  generateResumeFeedback(resume: Resume): Promise<ResumeFeedback>;
  parseResume(resumeText: string): Promise<any>;
}
