import { Candidate } from '../../../../src/domain/entities/Candidate';
import { TestDataBuilder } from '../../../helpers/TestDataBuilder';

describe('Candidate', () => {
  it('throws for an invalid email', () => {
    expect(() =>
      TestDataBuilder.candidate({
        email: 'invalid-email',
      }),
    ).toThrow('Invalid email format.');
  });

  it('adds a new skill', () => {
    const candidate = TestDataBuilder.candidate({
      skills: ['TypeScript'],
    });

    candidate.addSkill('Node.js');

    expect(candidate.getSkills()).toEqual(['TypeScript', 'Node.js']);
  });

  it('does not duplicate skills when adding an existing skill', () => {
    const candidate = TestDataBuilder.candidate({
      skills: ['TypeScript'],
    });

    candidate.addSkill('TypeScript');

    expect(candidate.getSkills()).toEqual(['TypeScript']);
  });

  it('updates the status', () => {
    const candidate = TestDataBuilder.candidate();

    candidate.updateStatus('archived');

    expect(candidate.getStatus()).toBe('archived');
  });
});
