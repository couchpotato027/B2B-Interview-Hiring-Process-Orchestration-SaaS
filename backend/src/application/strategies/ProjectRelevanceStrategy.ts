import type { CandidateProject } from '../../domain/entities/Candidate';
import type { Candidate } from '../../domain/entities/Candidate';
import type { Job } from '../../domain/entities/Job';
import type { IScoringStrategy } from '../../domain/strategies/IScoringStrategy';

export class ProjectRelevanceStrategy implements IScoringStrategy {
  private static readonly WEIGHT = 0.3;

  public async calculate(candidate: Candidate, job: Job): Promise<number> {
    const projects = candidate.getProjects();
    const requiredSkills = new Set(job.getRequiredSkills().map((skill) => skill.toLowerCase()));

    if (projects.length === 0 || requiredSkills.size === 0) {
      return 0;
    }

    const relevantProjects = projects.filter((project) =>
      this.projectUsesRequiredTechnology(project, requiredSkills),
    ).length;

    return Number(((relevantProjects / projects.length) * 100).toFixed(2));
  }

  public getName(): string {
    return 'Project Relevance';
  }

  public getWeight(): number {
    return ProjectRelevanceStrategy.WEIGHT;
  }

  private projectUsesRequiredTechnology(
    project: CandidateProject,
    requiredSkills: Set<string>,
  ): boolean {
    return project.technologies.some((technology) => requiredSkills.has(technology.toLowerCase()));
  }
}
