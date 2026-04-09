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

export interface ComparativeInsights {
  strongestCandidateId: string;
  rankings: Array<{
    candidateId: string;
    rank: number;
    differentiator: string;
  }>;
  skillGapAnalysis: string;
  summary: string;
}

export interface MarketInsights {
  skillDemand: Array<{
    skill: string;
    demandLevel: 'high' | 'medium' | 'low';
  }>;
  suggestedSalaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  similarJobTitles: string[];
  interviewQuestions: string[];
}

export interface ResumeFeedback {
  strengths: string[];
  improvements: string[];
  missingKeywords: string[];
  formattingSuggestions: string[];
  overallScore: number;
}
