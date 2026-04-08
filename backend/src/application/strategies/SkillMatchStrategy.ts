import type { Candidate } from '../../domain/entities/Candidate';
import type { Job } from '../../domain/entities/Job';
import type { IScoringStrategy } from '../../domain/strategies/IScoringStrategy';

export class SkillMatchStrategy implements IScoringStrategy {
  private static readonly WEIGHT = 0.4;
  private static readonly PREFERRED_SKILL_BONUS = 10;

  public async calculate(candidate: Candidate, job: Job): Promise<number> {
    const candidateSkills = new Set(candidate.getSkills().map((skill) => skill.toLowerCase()));
    const requiredSkills = job.getRequiredSkills().map((skill) => skill.toLowerCase());
    const preferredSkills = job.getPreferredSkills().map((skill) => skill.toLowerCase());

    if (requiredSkills.length === 0) {
      return 0;
    }

    const matchingRequiredSkills = requiredSkills.filter((skill) => candidateSkills.has(skill)).length;
    const matchingPreferredSkills = preferredSkills.filter((skill) => candidateSkills.has(skill)).length;

    const baseScore = (matchingRequiredSkills / requiredSkills.length) * 100;
    const preferredBonus =
      preferredSkills.length > 0
        ? (matchingPreferredSkills / preferredSkills.length) *
          SkillMatchStrategy.PREFERRED_SKILL_BONUS
        : 0;

    return clampScore(baseScore + preferredBonus);
  }

  public getName(): string {
    return 'Skill Match';
  }

  public getWeight(): number {
    return SkillMatchStrategy.WEIGHT;
  }
}

const clampScore = (score: number): number => Math.min(100, Math.max(0, Number(score.toFixed(2))));
