import type { CandidateProject as Project } from '../entities/Candidate';

export type { Project };

export interface ProjectAnalysis {
  projectTitle: string;
  relevanceScore: number;
  matchingSkills: string[];
  reasoning: string;
}

export interface CandidateInsights {
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  recommendation: string;
  summary: string;
}

export interface FitEvaluation {
  fitScore: number;
  reasoning: string;
  keyPoints: string[];
}
