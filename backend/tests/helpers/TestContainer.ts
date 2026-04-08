import { CandidateScorer } from '../../src/application/services/CandidateScorer';
import { ResumeParsingService } from '../../src/application/services/ResumeParsingService';
import { CreateJobUseCase } from '../../src/application/use-cases/CreateJobUseCase';
import { EvaluateCandidateUseCase } from '../../src/application/use-cases/EvaluateCandidateUseCase';
import { GetCandidateDetailsUseCase } from '../../src/application/use-cases/GetCandidateDetailsUseCase';
import { ProcessResumeUseCase } from '../../src/application/use-cases/ProcessResumeUseCase';
import { RankCandidatesForJobUseCase } from '../../src/application/use-cases/RankCandidatesForJobUseCase';
import { ScoringStrategyFactory } from '../../src/application/strategies/ScoringStrategyFactory';
import type { IAIService } from '../../src/domain/services/IAIService';
import { EventEmitter } from '../../src/infrastructure/events/EventEmitter';
import { Container } from '../../src/infrastructure/di/Container';
import { InMemoryCandidateRepository } from '../../src/infrastructure/repositories/InMemoryCandidateRepository';
import { InMemoryEvaluationRepository } from '../../src/infrastructure/repositories/InMemoryEvaluationRepository';
import { InMemoryJobRepository } from '../../src/infrastructure/repositories/InMemoryJobRepository';
import { InMemoryResumeRepository } from '../../src/infrastructure/repositories/InMemoryResumeRepository';
import { MockAIService } from './MockAIService';

export const setupTestContainer = (aiService: IAIService = new MockAIService()): Container => {
  const container = Container.getInstance();
  container.reset();

  container.register('EventEmitter', () => EventEmitter.getInstance());
  container.register('CandidateRepository', () => new InMemoryCandidateRepository());
  container.register('JobRepository', () => new InMemoryJobRepository());
  container.register('ResumeRepository', () => new InMemoryResumeRepository());
  container.register('EvaluationRepository', () => new InMemoryEvaluationRepository());
  container.register('AIService', () => aiService);
  container.register('ResumeParsingService', () => new ResumeParsingService());
  container.register(
    'CandidateScorer',
    () => new CandidateScorer(ScoringStrategyFactory.getDefaultStrategies()),
  );
  container.register(
    'ProcessResumeUseCase',
    () =>
      new ProcessResumeUseCase({
        candidateRepository: container.resolve('CandidateRepository'),
        resumeRepository: container.resolve('ResumeRepository'),
        aiService: container.resolve<IAIService>('AIService'),
        resumeParsingService: container.resolve('ResumeParsingService'),
        eventEmitter: container.resolve('EventEmitter'),
      }),
  );
  container.register(
    'CreateJobUseCase',
    () => new CreateJobUseCase(container.resolve('JobRepository')),
  );
  container.register(
    'EvaluateCandidateUseCase',
    () =>
      new EvaluateCandidateUseCase({
        candidateRepository: container.resolve('CandidateRepository'),
        jobRepository: container.resolve('JobRepository'),
        evaluationRepository: container.resolve('EvaluationRepository'),
        aiService: container.resolve<IAIService>('AIService'),
        eventEmitter: container.resolve('EventEmitter'),
      }),
  );
  container.register(
    'RankCandidatesForJobUseCase',
    () =>
      new RankCandidatesForJobUseCase({
        candidateRepository: container.resolve('CandidateRepository'),
        jobRepository: container.resolve('JobRepository'),
        evaluationRepository: container.resolve('EvaluationRepository'),
        eventEmitter: container.resolve('EventEmitter'),
      }),
  );
  container.register(
    'GetCandidateDetailsUseCase',
    () =>
      new GetCandidateDetailsUseCase({
        candidateRepository: container.resolve('CandidateRepository'),
        resumeRepository: container.resolve('ResumeRepository'),
        evaluationRepository: container.resolve('EvaluationRepository'),
      }),
  );

  return container;
};
