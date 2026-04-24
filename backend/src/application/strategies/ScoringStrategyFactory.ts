import type { IScoringStrategy } from '../../domain/strategies/IScoringStrategy';
import { ExperienceMatchStrategy } from './ExperienceMatchStrategy';
import { ProjectRelevanceStrategy } from './ProjectRelevanceStrategy';
import { SkillMatchStrategy } from './SkillMatchStrategy';
import { EducationStrategy } from './EducationStrategy';

export interface ScoringStrategyConfig {
  includeSkillMatch?: boolean;
  includeExperienceMatch?: boolean;
  includeProjectRelevance?: boolean;
}

export class ScoringStrategyFactory {
  public static getDefaultStrategies(): IScoringStrategy[] {
    return [
      new SkillMatchStrategy(),
      new ExperienceMatchStrategy(),
      new ProjectRelevanceStrategy(),
      new EducationStrategy(),
    ];
  }

  public static getCustomStrategies(config: ScoringStrategyConfig): IScoringStrategy[] {
    const strategies: IScoringStrategy[] = [];

    if (config.includeSkillMatch) {
      strategies.push(new SkillMatchStrategy());
    }

    if (config.includeExperienceMatch) {
      strategies.push(new ExperienceMatchStrategy());
    }

    if (config.includeProjectRelevance) {
      strategies.push(new ProjectRelevanceStrategy());
    }

    return strategies;
  }
}
