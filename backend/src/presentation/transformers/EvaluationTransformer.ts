import { Evaluation } from '../../domain/entities/Evaluation';

export interface EvaluationDTO {
  id: string;
  candidateId: string;
  jobId: string;
  skillMatchScore: number;
  experienceScore: number;
  projectRelevanceScore: number;
  educationScore: number;
  culturalFitScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  recommendation: string;
  summary: string;
  evaluatedAt: string;
}

export class EvaluationTransformer {
  public static toDTO(evaluation: Evaluation): EvaluationDTO {
    return {
      id: evaluation.getId(),
      candidateId: evaluation.getCandidateId(),
      jobId: evaluation.getJobId(),
      skillMatchScore: evaluation.getSkillMatchScore(),
      experienceScore: evaluation.getExperienceScore(),
      projectRelevanceScore: evaluation.getProjectRelevanceScore(),
      educationScore: evaluation.getEducationScore(),
      culturalFitScore: evaluation.getCulturalFitScore(),
      overallScore: evaluation.getOverallScore(),
      strengths: evaluation.getStrengths(),
      weaknesses: evaluation.getWeaknesses(),
      missingSkills: evaluation.getMissingSkills(),
      recommendation: evaluation.getRecommendation(),
      summary: evaluation.getSummary(),
      evaluatedAt: evaluation.getEvaluatedAt().toISOString(),
    };
  }

  public static toCollectionDTO(evaluations: Evaluation[]): EvaluationDTO[] {
    return evaluations.map(e => this.toDTO(e));
  }
}
