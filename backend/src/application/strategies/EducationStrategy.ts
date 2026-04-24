import type { Candidate, CandidateEducation } from '../../domain/entities/Candidate';
import type { Job } from '../../domain/entities/Job';
import type { IScoringStrategy } from '../../domain/strategies/IScoringStrategy';

export class EducationStrategy implements IScoringStrategy {
  private static readonly WEIGHT = 0.1;

  public async calculate(candidate: Candidate, job: Job): Promise<number> {
    const education: CandidateEducation[] = candidate.getEducation();
    if (!education || education.length === 0) {
      return 0; // Or based on job requirements... if job doesn't require, maybe we return 50?
    }

    let score = 0;

    for (const edu of education) {
      const degreeStr = edu.degree.toLowerCase();
      // Increase score based on degree level
      if (/phd|doctorate/i.test(degreeStr)) {
        score += 100;
      } else if (/master|ms|m\.s\.|msc|m\.tech|mba/i.test(degreeStr)) {
        score += 85;
      } else if (/bachelor|bs|b\.s\.|bsc|b\.tech|b\.e\.|bba/i.test(degreeStr)) {
        score += 70;
      } else {
        score += 40;
      }

      // Bonus points for Tier 1 university
      const universityStr = edu.institution.toLowerCase();
      if (/mit|stanford|harvard|berkeley|caltech|oxford|cambridge|iit|bits|cmc|princeton|carnegie/i.test(universityStr)) {
        score += 20; 
      }
    }

    // Average the education records or take the max? Take the max degree score since degrees are additive usually.
    return Math.min(100, Number(score));
  }

  public getName(): string {
    return 'Education';
  }

  public getWeight(job?: Job): number {
    return job?.getScoringWeights()?.education ?? EducationStrategy.WEIGHT;
  }
}
