import { Container } from '../../../src/infrastructure/di/Container';
import { EvaluateCandidateUseCase } from '../../../src/application/use-cases/EvaluateCandidateUseCase';
import type { ICandidateRepository } from '../../../src/domain/repositories/ICandidateRepository';
import type { IJobRepository } from '../../../src/domain/repositories/IJobRepository';
import type { IEvaluationRepository } from '../../../src/domain/repositories/IEvaluationRepository';
import { setupTestContainer } from '../../helpers/TestContainer';
import { TestDataBuilder } from '../../helpers/TestDataBuilder';

describe('EvaluateCandidateUseCase', () => {
  beforeEach(() => {
    setupTestContainer();
  });

  it('calculates scores and saves the evaluation', async () => {
    const container = Container.getInstance();
    const candidateRepository = container.resolve<ICandidateRepository>('CandidateRepository');
    const jobRepository = container.resolve<IJobRepository>('JobRepository');
    const evaluationRepository = container.resolve<IEvaluationRepository>('EvaluationRepository');
    const candidate = await candidateRepository.save(TestDataBuilder.candidate());
    const job = await jobRepository.save(TestDataBuilder.job());
    const useCase = container.resolve<EvaluateCandidateUseCase>('EvaluateCandidateUseCase');

    const result = await useCase.execute({
      candidateId: candidate.getId(),
      jobId: job.getId(),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.getOverallScore()).toBeGreaterThan(0);
      const saved = await evaluationRepository.findById(result.data.getId());
      expect(saved).not.toBeNull();
    }
  });

  it('returns not found when candidate does not exist', async () => {
    const container = Container.getInstance();
    const jobRepository = container.resolve<IJobRepository>('JobRepository');
    const job = await jobRepository.save(TestDataBuilder.job());
    const useCase = container.resolve<EvaluateCandidateUseCase>('EvaluateCandidateUseCase');

    const result = await useCase.execute({
      candidateId: 'missing-candidate',
      jobId: job.getId(),
    });

    expect(result).toEqual({
      success: false,
      error: 'Candidate missing-candidate not found.',
      code: 'CANDIDATE_NOT_FOUND',
    });
  });

  it('returns not found when job does not exist', async () => {
    const container = Container.getInstance();
    const candidateRepository = container.resolve<ICandidateRepository>('CandidateRepository');
    const candidate = await candidateRepository.save(TestDataBuilder.candidate());
    const useCase = container.resolve<EvaluateCandidateUseCase>('EvaluateCandidateUseCase');

    const result = await useCase.execute({
      candidateId: candidate.getId(),
      jobId: 'missing-job',
    });

    expect(result).toEqual({
      success: false,
      error: 'Job missing-job not found.',
      code: 'JOB_NOT_FOUND',
    });
  });
});
