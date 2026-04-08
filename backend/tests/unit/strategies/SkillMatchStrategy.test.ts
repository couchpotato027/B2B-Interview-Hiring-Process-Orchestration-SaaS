import { SkillMatchStrategy } from '../../../src/application/strategies/SkillMatchStrategy';
import { TestDataBuilder } from '../../helpers/TestDataBuilder';

describe('SkillMatchStrategy', () => {
  it('returns 100 for a full required-skill match', async () => {
    const candidate = TestDataBuilder.candidate({
      skills: ['TypeScript', 'Node.js'],
    });
    const job = TestDataBuilder.job({
      requiredSkills: ['TypeScript', 'Node.js'],
      preferredSkills: [],
    });

    await expect(new SkillMatchStrategy().calculate(candidate, job)).resolves.toBe(100);
  });

  it('returns 50 for a half required-skill match', async () => {
    const candidate = TestDataBuilder.candidate({
      skills: ['TypeScript'],
    });
    const job = TestDataBuilder.job({
      requiredSkills: ['TypeScript', 'Node.js'],
      preferredSkills: [],
    });

    await expect(new SkillMatchStrategy().calculate(candidate, job)).resolves.toBe(50);
  });

  it('returns 0 for no required-skill match', async () => {
    const candidate = TestDataBuilder.candidate({
      skills: ['Python'],
    });
    const job = TestDataBuilder.job({
      requiredSkills: ['TypeScript', 'Node.js'],
      preferredSkills: [],
    });

    await expect(new SkillMatchStrategy().calculate(candidate, job)).resolves.toBe(0);
  });

  it('applies a preferred-skill bonus', async () => {
    const candidate = TestDataBuilder.candidate({
      skills: ['TypeScript', 'Node.js', 'Docker'],
    });
    const job = TestDataBuilder.job({
      requiredSkills: ['TypeScript', 'Node.js'],
      preferredSkills: ['Docker'],
    });

    await expect(new SkillMatchStrategy().calculate(candidate, job)).resolves.toBe(100);
  });
});
