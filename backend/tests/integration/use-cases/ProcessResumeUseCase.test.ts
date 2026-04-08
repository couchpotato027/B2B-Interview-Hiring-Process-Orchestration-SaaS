import { Container } from '../../../src/infrastructure/di/Container';
import { ProcessResumeUseCase } from '../../../src/application/use-cases/ProcessResumeUseCase';
import { setupTestContainer } from '../../helpers/TestContainer';

describe('ProcessResumeUseCase', () => {
  beforeEach(() => {
    setupTestContainer();
  });

  it('creates a candidate and saves a resume from a text upload', async () => {
    const container = Container.getInstance();
    const useCase = container.resolve<ProcessResumeUseCase>('ProcessResumeUseCase');

    const result = await useCase.execute({
      file: Buffer.from(
        [
          'Jane Doe',
          'jane.doe@example.com',
          'TypeScript, Node.js',
          'Experience',
          '4 years',
          'Education',
          'B.Tech',
        ].join('\n'),
      ),
      fileName: 'resume.txt',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.candidate.getEmail()).toBe('jane.doe@example.com');
      expect(result.data.resume.getCandidateId()).toBe(result.data.candidate.getId());
    }
  });

  it('merges AI-extracted skills into the candidate profile', async () => {
    const container = Container.getInstance();
    const useCase = container.resolve<ProcessResumeUseCase>('ProcessResumeUseCase');

    const result = await useCase.execute({
      file: Buffer.from('Jane Doe\njane.doe@example.com\nTypeScript'),
      fileName: 'resume.txt',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.candidate.getSkills()).toEqual(
        expect.arrayContaining(['TypeScript', 'Node.js', 'Docker']),
      );
    }
  });

  it('returns an error for unsupported file types', async () => {
    const container = Container.getInstance();
    const useCase = container.resolve<ProcessResumeUseCase>('ProcessResumeUseCase');

    const result = await useCase.execute({
      file: Buffer.from('irrelevant'),
      fileName: 'resume.png',
    });

    expect(result).toEqual({
      success: false,
      error: 'Failed to parse resume "resume.png": No resume parser available for file type ".png".',
      code: 'INVALID_FILE_FORMAT',
    });
  });
});
