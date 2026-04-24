import type { CandidateProject } from '../../domain/entities/Candidate';
import type { Candidate } from '../../domain/entities/Candidate';
import type { Job } from '../../domain/entities/Job';
import type { IScoringStrategy } from '../../domain/strategies/IScoringStrategy';

export class ProjectRelevanceStrategy implements IScoringStrategy {
  private static readonly WEIGHT = 0.3;

  public async calculate(candidate: Candidate, job: Job): Promise<number> {
    const projects = candidate.getProjects();
    const requiredSkills = new Set(job.getRequiredSkills().map((skill) => skill.toLowerCase()));

    if (projects.length === 0) {
      return 0;
    }

    let totalScore = 0;

    for (const project of projects) {
      let isRelevant = requiredSkills.size === 0 || this.projectUsesRequiredTechnology(project, requiredSkills);
      let projectScore = isRelevant ? (100 / projects.length) : 0;

      if (projectScore > 0) {
        // Boost by quality metrics based on description NLP
        const description = (project.description || '').toLowerCase();
        
        const scaleMatch = /million|billion|\d+k req|\d+k users|large[- ]scale|high[- ]throughput/i.test(description);
        const leadershipMatch = /led|architected|pioneered|managed|directed|spearheaded/i.test(description);
        const impactMatch = /increased revenue|reduced|optimized|decreased latency|improved/i.test(description);

        let boost = 0;
        if (scaleMatch) boost += 0.05;
        if (leadershipMatch) boost += 0.05;
        if (impactMatch) boost += 0.10;

        projectScore += projectScore * boost;

        // Apply Recency Bias
        if (project.endDate) {
           const yearsAgo = (new Date().getFullYear()) - (new Date(project.endDate).getFullYear());
           const decayFactor = Math.max(0.5, 1 - (0.1 * yearsAgo));
           projectScore *= decayFactor;
        }
      }
      totalScore += projectScore;
    }

    return Math.min(100, Number(totalScore.toFixed(2)));
  }

  public getName(): string {
    return 'Project Relevance';
  }

  public getWeight(job?: Job): number {
    return job?.getScoringWeights()?.projects ?? ProjectRelevanceStrategy.WEIGHT;
  }

  private projectUsesRequiredTechnology(
    project: CandidateProject,
    requiredSkills: Set<string>,
  ): boolean {
    return project.technologies.some((technology) => requiredSkills.has(technology.toLowerCase()));
  }
}
