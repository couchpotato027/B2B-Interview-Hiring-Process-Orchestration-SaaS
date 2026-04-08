import type { Candidate } from '../../domain/entities/Candidate';
import type { Job } from '../../domain/entities/Job';
import type { IScoringStrategy } from '../../domain/strategies/IScoringStrategy';
import type { ScoreBreakdown } from '../../domain/types/ScoringTypes';

export class CandidateScorer {
  constructor(private readonly strategies: IScoringStrategy[]) {}

  public async calculateScore(candidate: Candidate, job: Job): Promise<ScoreBreakdown> {
    const strategies = await Promise.all(
      this.strategies.map(async (strategy) => {
        const score = await strategy.calculate(candidate, job);

        return {
          name: strategy.getName(),
          score: Number(score.toFixed(2)),
          weight: strategy.getWeight(),
        };
      }),
    );

    const overallScore = Number(
      strategies
        .reduce((total, strategy) => total + strategy.score * strategy.weight, 0)
        .toFixed(2),
    );

    return {
      strategies,
      overallScore,
    };
  }
}
