import { describe, it, expect } from '@jest/globals';
import { TestDataBuilder } from '../../../helpers/TestDataBuilder';

describe('Job', () => {
  it('throws when required skills are empty', () => {
    expect(() =>
      TestDataBuilder.job({
        requiredSkills: [],
      }),
    ).toThrow('At least one required skill must be provided.');
  });

  it('adds a required skill', () => {
    const job = TestDataBuilder.job({
      requiredSkills: ['TypeScript'],
    });

    job.addRequiredSkill('Node.js');

    expect(job.getRequiredSkills()).toEqual(['TypeScript', 'Node.js']);
  });

  it('closes the job', () => {
    const job = TestDataBuilder.job();

    job.close();

    expect(job.getStatus()).toBe('closed');
  });
});
