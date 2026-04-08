import { ExperienceMatchStrategy } from '../../../src/application/strategies/ExperienceMatchStrategy';
import { TestDataBuilder } from '../../helpers/TestDataBuilder';

describe('ExperienceMatchStrategy', () => {
  it('returns 100 for an exact experience match', async () => {
    const candidate = TestDataBuilder.candidate({
      yearsOfExperience: 3,
    });
    const job = TestDataBuilder.job({
      requiredExperience: 3,
    });

    await expect(new ExperienceMatchStrategy().calculate(candidate, job)).resolves.toBe(100);
  });

  it('returns 100 when experience exceeds the requirement', async () => {
    const candidate = TestDataBuilder.candidate({
      yearsOfExperience: 5,
    });
    const job = TestDataBuilder.job({
      requiredExperience: 3,
    });

    await expect(new ExperienceMatchStrategy().calculate(candidate, job)).resolves.toBe(100);
  });

  it('returns 60 when experience is half the requirement', async () => {
    const candidate = TestDataBuilder.candidate({
      yearsOfExperience: 2,
    });
    const job = TestDataBuilder.job({
      requiredExperience: 4,
    });

    await expect(new ExperienceMatchStrategy().calculate(candidate, job)).resolves.toBe(60);
  });

  it('returns a proportional score when experience is far below the requirement', async () => {
    const candidate = TestDataBuilder.candidate({
      yearsOfExperience: 1,
    });
    const job = TestDataBuilder.job({
      requiredExperience: 4,
    });

    await expect(new ExperienceMatchStrategy().calculate(candidate, job)).resolves.toBe(12.5);
  });
});
