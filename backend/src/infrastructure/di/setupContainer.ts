import { CandidateScorer } from '../../application/services/CandidateScorer';
import { ResumeParsingService } from '../../application/services/ResumeParsingService';
import { CreateJobUseCase } from '../../application/use-cases/CreateJobUseCase';
import { EvaluateCandidateUseCase } from '../../application/use-cases/EvaluateCandidateUseCase';
import { GetCandidateDetailsUseCase } from '../../application/use-cases/GetCandidateDetailsUseCase';
import { ListCandidatesUseCase } from '../../application/use-cases/ListCandidatesUseCase';
import { ProcessResumeUseCase } from '../../application/use-cases/ProcessResumeUseCase';
import { RankCandidatesForJobUseCase } from '../../application/use-cases/RankCandidatesForJobUseCase';
import { BatchEvaluationUseCase } from '../../application/use-cases/BatchEvaluationUseCase';
import { ComparativeCandidateAnalysisUseCase } from '../../application/use-cases/ComparativeCandidateAnalysisUseCase';
import { JobMarketInsightsUseCase } from '../../application/use-cases/JobMarketInsightsUseCase';
import { ResumeFeedbackUseCase } from '../../application/use-cases/ResumeFeedbackUseCase';
import { CreatePipelineUseCase } from '../../application/use-cases/CreatePipelineUseCase';
import { MoveCandidateThroughPipelineUseCase } from '../../application/use-cases/MoveCandidateThroughPipelineUseCase';
import { GetPipelineBoardUseCase } from '../../application/use-cases/GetPipelineBoardUseCase';
import { BulkMoveCandidatesUseCase } from '../../application/use-cases/BulkMoveCandidatesUseCase';
import { ScoringStrategyFactory } from '../../application/strategies/ScoringStrategyFactory';
import type { IAIService } from '../../domain/services/IAIService';
import { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { IPipelineRepository } from '../../domain/repositories/IPipelineRepository';
import { ICandidatePipelineStatusRepository } from '../../domain/repositories/ICandidatePipelineStatusRepository';
import { EventEmitter } from '../events/EventEmitter';
import { ObserverRegistry } from '../observers/ObserverRegistry';
import { InMemoryCandidateRepository } from '../repositories/InMemoryCandidateRepository';
import { InMemoryEvaluationRepository } from '../repositories/InMemoryEvaluationRepository';
import { InMemoryJobRepository } from '../repositories/InMemoryJobRepository';
import { InMemoryResumeRepository } from '../repositories/InMemoryResumeRepository';
import { InMemoryPipelineRepository } from '../repositories/InMemoryPipelineRepository';
import { InMemoryCandidatePipelineStatusRepository } from '../repositories/InMemoryCandidatePipelineStatusRepository';
import { GeminiAIService } from '../services/GeminiAIService';
import { NoopAIService } from '../services/NoopAIService';
import { env } from '../config/env';
import { Container } from './Container';

export const setupContainer = (): Container => {
  const container = Container.getInstance();
  container.reset();

  container.register('EventEmitter', () => EventEmitter.getInstance());

  container.register('CandidateRepository', () => new InMemoryCandidateRepository());
  container.register('JobRepository', () => new InMemoryJobRepository());
  container.register('ResumeRepository', () => new InMemoryResumeRepository());
  container.register('EvaluationRepository', () => new InMemoryEvaluationRepository());
  container.register('PipelineRepository', () => new InMemoryPipelineRepository());
  container.register('CandidatePipelineStatusRepository', () => new InMemoryCandidatePipelineStatusRepository());

  container.register('AIService', () =>
    env.geminiApiKey ? new GeminiAIService() : new NoopAIService(),
  );
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
    'ListCandidatesUseCase',
    () =>
      new ListCandidatesUseCase({
        candidateRepository: container.resolve('CandidateRepository'),
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
    'BatchEvaluationUseCase',
    () =>
      new BatchEvaluationUseCase({
        candidateRepository: container.resolve('CandidateRepository'),
        jobRepository: container.resolve('JobRepository'),
        evaluationRepository: container.resolve('EvaluationRepository'),
        aiService: container.resolve<IAIService>('AIService'),
      }),
  );

  container.register(
    'ComparativeCandidateAnalysisUseCase',
    () =>
      new ComparativeCandidateAnalysisUseCase(
        container.resolve('CandidateRepository'),
        container.resolve('JobRepository'),
        container.resolve('EvaluationRepository'),
        container.resolve<IAIService>('AIService'),
      ),
  );

  container.register(
    'JobMarketInsightsUseCase',
    () =>
      new JobMarketInsightsUseCase(
        container.resolve('JobRepository'),
        container.resolve<IAIService>('AIService'),
      ),
  );

  container.register(
    'ResumeFeedbackUseCase',
    () =>
      new ResumeFeedbackUseCase(
        container.resolve('CandidateRepository'),
        container.resolve('ResumeRepository'),
        container.resolve<IAIService>('AIService'),
      ),
  );

  // Pipeline Use Cases
  container.register(
    'CreatePipelineUseCase',
    () => new CreatePipelineUseCase(
        container.resolve('PipelineRepository'),
        container.resolve('EventEmitter')
    )
  );

  container.register(
    'MoveCandidateThroughPipelineUseCase',
    () => new MoveCandidateThroughPipelineUseCase(
        container.resolve('CandidatePipelineStatusRepository'),
        container.resolve('PipelineRepository'),
        container.resolve('EventEmitter')
    )
  );

  container.register(
    'GetPipelineBoardUseCase',
    () => new GetPipelineBoardUseCase(
        container.resolve('PipelineRepository'),
        container.resolve('CandidatePipelineStatusRepository'),
        container.resolve<ICandidateRepository>('CandidateRepository')
    )
  );

  container.register(
    'BulkMoveCandidatesUseCase',
    () => new BulkMoveCandidatesUseCase(
        container.resolve('MoveCandidateThroughPipelineUseCase')
    )
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
