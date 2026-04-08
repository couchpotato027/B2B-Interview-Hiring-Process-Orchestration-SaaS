import type { Candidate } from '../entities/Candidate';
import type { Job } from '../entities/Job';
import type {
  CandidateInsights,
  FitEvaluation,
  Project,
  ProjectAnalysis,
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
}
