import { Candidate } from '../../domain/entities/Candidate';
import { Job } from '../../domain/entities/Job';

export interface ScoreResult {
  skillMatchScore: number;
  experienceScore: number;
  projectRelevanceScore: number;
  overallScore: number;
}

export class ScoringService {
  public calculateScores(candidate: Candidate, job: Job): ScoreResult {
    const skillMatchScore = this.calculateSkillMatch(candidate.getSkills(), job.getRequiredSkills(), job.getPreferredSkills());
    const experienceScore = this.calculateExperienceScore(candidate.getYearsOfExperience(), job.getRequiredExperience());
    const projectRelevanceScore = this.calculateProjectRelevance(candidate.getProjects(), job.getRequiredSkills());

    const overallScore = Math.round(
      (skillMatchScore * 0.4) +
      (experienceScore * 0.3) +
      (projectRelevanceScore * 0.3)
    );

    return {
      skillMatchScore,
      experienceScore,
      projectRelevanceScore,
      overallScore
    };
  }

  private calculateSkillMatch(candidateSkills: string[], required: string[], preferred: string[]): number {
    if (required.length === 0) return 100;

    const matches = required.filter(s => 
      candidateSkills.some(cs => cs.toLowerCase() === s.toLowerCase())
    );
    
    let score = (matches.length / required.length) * 100;

    const preferredMatches = preferred.filter(s => 
      candidateSkills.some(cs => cs.toLowerCase() === s.toLowerCase())
    );

    const bonus = preferredMatches.length * 10;
    score = Math.min(100, score + bonus);

    return Math.round(score);
  }

  private calculateExperienceScore(candidateYears: number, requiredYears: number): number {
    if (requiredYears <= 0) return 100;
    
    if (candidateYears >= requiredYears) {
      return 100;
    } else if (candidateYears >= requiredYears * 0.8) {
      return 80;
    } else if (candidateYears >= requiredYears * 0.5) {
      return 60;
    } else {
      return Math.round((candidateYears / requiredYears) * 50);
    }
  }

  private calculateProjectRelevance(projects: any[], requiredSkills: string[]): number {
    if (projects.length === 0) return 0;
    if (requiredSkills.length === 0) return 100;

    let relevantCount = 0;
    const lowerRequired = requiredSkills.map(s => s.toLowerCase());

    for (const project of projects) {
      const tech = (project.technologies || []).map((t: string) => t.toLowerCase());
      const hasMatch = tech.some((t: string) => lowerRequired.includes(t));
      if (hasMatch) {
        relevantCount++;
      }
    }

    return Math.round((relevantCount / projects.length) * 100);
  }
}
