import { CandidateScorer } from '../../application/services/CandidateScorer';
import { ResumeParsingService } from '../../application/services/ResumeParsingService';
import { CreateJobUseCase } from '../../application/use-cases/CreateJobUseCase';
import { EvaluateCandidateUseCase } from '../../application/use-cases/EvaluateCandidateUseCase';
import { GetCandidateDetailsUseCase } from '../../application/use-cases/GetCandidateDetailsUseCase';
import { ProcessResumeUseCase } from '../../application/use-cases/ProcessResumeUseCase';
import { RankCandidatesForJobUseCase } from '../../application/use-cases/RankCandidatesForJobUseCase';
import { ScoringStrategyFactory } from '../../application/strategies/ScoringStrategyFactory';
import type { IAIService } from '../../domain/services/IAIService';
import { EventEmitter } from '../events/EventEmitter';
import { ObserverRegistry } from '../observers/ObserverRegistry';
import { InMemoryCandidateRepository } from '../repositories/InMemoryCandidateRepository';
import { InMemoryEvaluationRepository } from '../repositories/InMemoryEvaluationRepository';
import { InMemoryJobRepository } from '../repositories/InMemoryJobRepository';
import { InMemoryResumeRepository } from '../repositories/InMemoryResumeRepository';
import { ClaudeAIService } from '../services/ClaudeAIService';
import { Container } from './Container';

export const setupContainer = (): Container => {
  const container = Container.getInstance();
  container.reset();

  container.register('EventEmitter', () => EventEmitter.getInstance());

  container.register('CandidateRepository', () => new InMemoryCandidateRepository());
  container.register('JobRepository', () => new InMemoryJobRepository());
  container.register('ResumeRepository', () => new InMemoryResumeRepository());
  container.register('EvaluationRepository', () => new InMemoryEvaluationRepository());

  container.register('AIService', () => new ClaudeAIService());
  container.register('ResumeParsingService', () => new ResumeParsingService());
  container.register(
    'CandidateScorer',
    () => new CandidateScorer(ScoringStrategyFactory.getDefaultStrategies()),
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
    'ObserverRegistry',
    () =>
      new ObserverRegistry(
        container.resolve('ResumeRepository'),
        container.resolve('EventEmitter'),
      ),
  );

  container.resolve<ObserverRegistry>('ObserverRegistry').registerAll();

  return container;
};
