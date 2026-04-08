import type { Candidate } from '../../domain/entities/Candidate';
import type { Job } from '../../domain/entities/Job';
import type { IScoringStrategy } from '../../domain/strategies/IScoringStrategy';

export class ExperienceMatchStrategy implements IScoringStrategy {
  private static readonly WEIGHT = 0.3;

  public async calculate(candidate: Candidate, job: Job): Promise<number> {
    const candidateExperience = candidate.getYearsOfExperience();
    const requiredExperience = job.getRequiredExperience();

    if (requiredExperience === 0) {
      return 100;
    }

    if (candidateExperience >= requiredExperience) {
      return 100;
    }

    if (candidateExperience >= requiredExperience * 0.8) {
      return 80;
    }

    if (candidateExperience >= requiredExperience * 0.5) {
      return 60;
    }

    return Math.max(0, Math.min(100, Number(((candidateExperience / requiredExperience) * 50).toFixed(2))));
  }

  public getName(): string {
    return 'Experience Match';
  }

  public getWeight(): number {
    return ExperienceMatchStrategy.WEIGHT;
  }
}
