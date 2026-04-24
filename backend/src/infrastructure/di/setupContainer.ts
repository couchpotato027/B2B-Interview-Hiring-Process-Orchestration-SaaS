import { CandidateScorer } from '../../application/services/CandidateScorer';
import { ResumeParsingService } from '../../application/services/ResumeParsingService';
import { AnalyticsService } from '../../application/services/AnalyticsService';
import { AuthService } from '../services/AuthService';
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
import { GenerateHiringDashboardUseCase } from '../../application/use-cases/GenerateHiringDashboardUseCase';
import { GenerateJobReportUseCase } from '../../application/use-cases/GenerateJobReportUseCase';
import { ExportCandidateDataUseCase } from '../../application/use-cases/ExportCandidateDataUseCase';
import { CreatePipelineUseCase } from '../../application/use-cases/CreatePipelineUseCase';
import { MoveCandidateThroughPipelineUseCase } from '../../application/use-cases/MoveCandidateThroughPipelineUseCase';
import { GetPipelineBoardUseCase } from '../../application/use-cases/GetPipelineBoardUseCase';
import { BulkMoveCandidatesUseCase } from '../../application/use-cases/BulkMoveCandidatesUseCase';
import { ScoringStrategyFactory } from '../../application/strategies/ScoringStrategyFactory';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';
import { ChangePasswordUseCase } from '../../application/use-cases/ChangePasswordUseCase';

// File Storage Use Cases
import { UploadResumeFileUseCase } from '../../application/use-cases/UploadResumeFileUseCase';
import { DownloadResumeUseCase } from '../../application/use-cases/DownloadResumeUseCase';
import { DeleteResumeFileUseCase } from '../../application/use-cases/DeleteResumeFileUseCase';

// Search Use Cases
import { SearchCandidatesUseCase } from '../../application/use-cases/SearchCandidatesUseCase';
import { GetSuggestedCandidatesUseCase } from '../../application/use-cases/GetSuggestedCandidatesUseCase';
import { FindSimilarCandidatesUseCase } from '../../application/use-cases/FindSimilarCandidatesUseCase';
import { SaveSearchUseCase } from '../../application/use-cases/SaveSearchUseCase';
import { ExecuteSavedSearchUseCase } from '../../application/use-cases/ExecuteSavedSearchUseCase';

import type { IAIService } from '../../domain/services/IAIService';
import { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { IPipelineRepository } from '../../domain/repositories/IPipelineRepository';
import { ICandidatePipelineStatusRepository } from '../../domain/repositories/ICandidatePipelineStatusRepository';
import { EventEmitter } from '../events/EventEmitter';
import { ObserverRegistry } from '../observers/ObserverRegistry';
import { PrismaCandidateRepository } from '../repositories/PrismaCandidateRepository';
import { PrismaJobRepository } from '../repositories/PrismaJobRepository';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository';
import { InMemoryEvaluationRepository } from '../repositories/InMemoryEvaluationRepository';
import { InMemoryResumeRepository } from '../repositories/InMemoryResumeRepository';
import { PrismaPipelineRepository } from '../repositories/PrismaPipelineRepository';
import { PrismaCandidatePipelineStatusRepository } from '../repositories/PrismaCandidatePipelineStatusRepository';
import { prisma } from '../database/prisma.client';
import { InMemoryFileRepository } from '../repositories/InMemoryFileRepository';
import { InMemorySavedSearchRepository } from '../repositories/InMemorySavedSearchRepository';

import { GeminiAIService } from '../services/GeminiAIService';
import { NoopAIService } from '../services/NoopAIService';
import { ScheduledAnalyticsService } from '../jobs/ScheduledAnalyticsService';
import { LocalFileStorage } from '../storage/LocalFileStorage';
import { S3FileStorage } from '../storage/S3FileStorage';
import { FileProcessorWorker } from '../workers/FileProcessorWorker';
import { CleanupOrphanedFilesJob } from '../jobs/CleanupOrphanedFilesJob';
import { InMemorySearchService } from '../search/InMemorySearchService';

import { env } from '../config/env';
import { Container } from './Container';

export const setupContainer = (): Container => {
  const container = Container.getInstance();
  container.reset();

  container.register('EventEmitter', () => EventEmitter.getInstance());

  container.register('CandidateRepository', () => new PrismaCandidateRepository());
  container.register('JobRepository', () => new PrismaJobRepository());
  container.register('ResumeRepository', () => new InMemoryResumeRepository());
  container.register('EvaluationRepository', () => new InMemoryEvaluationRepository());
  container.register('PipelineRepository', () => new PrismaPipelineRepository());
  container.register('CandidatePipelineStatusRepository', () => new PrismaCandidatePipelineStatusRepository());
  container.register('UserRepository', () => new PrismaUserRepository());
  container.register('FileRepository', () => new InMemoryFileRepository());
  container.register('SavedSearchRepository', () => new InMemorySavedSearchRepository());

  container.register('AuthService', () => new AuthService(env.jwtSecret));
  container.register('SearchService', () => new InMemorySearchService());
  
  // Storage Service
  container.register('FileStorageService', () => {
    if (env.storageProvider === 's3') {
      return new S3FileStorage({
        bucket: env.s3Bucket,
        region: env.s3Region,
        accessKeyId: env.s3AccessKeyId,
        secretAccessKey: env.s3SecretAccessKey,
      });
    }
    return new LocalFileStorage(env.uploadDir, `${env.baseUrl}/uploads`);
  });

  container.register('AIService', () =>
    env.geminiApiKey ? new GeminiAIService() : new NoopAIService(),
  );
  container.register('ResumeParsingService', () => new ResumeParsingService());
  
  container.register('AnalyticsService', () => new AnalyticsService(
    container.resolve('CandidateRepository'),
    container.resolve('JobRepository'),
    container.resolve('EvaluationRepository'),
    container.resolve('PipelineRepository'),
    container.resolve('CandidatePipelineStatusRepository'),
    prisma
  ));

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

  // File Storage Use Cases
  container.register(
    'UploadResumeFileUseCase',
    () => new UploadResumeFileUseCase(
        container.resolve('FileStorageService'),
        container.resolve('FileRepository'),
        container.resolve('EventEmitter')
    )
  );

  container.register(
    'DownloadResumeUseCase',
    () => new DownloadResumeUseCase(
        container.resolve('FileStorageService'),
        container.resolve('FileRepository')
    )
  );

  container.register(
    'DeleteResumeFileUseCase',
    () => new DeleteResumeFileUseCase(
        container.resolve('FileRepository')
    )
  );

  // Search Use Cases
  container.register(
    'SearchCandidatesUseCase',
    () => new SearchCandidatesUseCase(container.resolve('SearchService'))
  );

  container.register(
    'GetSuggestedCandidatesUseCase',
    () => new GetSuggestedCandidatesUseCase(
        container.resolve('SearchService'),
        container.resolve('JobRepository')
    )
  );

  container.register(
    'FindSimilarCandidatesUseCase',
    () => new FindSimilarCandidatesUseCase(
        container.resolve('SearchService'),
        container.resolve('CandidateRepository')
    )
  );

  container.register(
    'SaveSearchUseCase',
    () => new SaveSearchUseCase(container.resolve('SavedSearchRepository'))
  );

  container.register(
    'ExecuteSavedSearchUseCase',
    () => new ExecuteSavedSearchUseCase(
        container.resolve('SavedSearchRepository'),
        container.resolve('SearchCandidatesUseCase')
    )
  );

  // Analytics Use Cases
  container.register(
    'GenerateHiringDashboardUseCase',
    () => new GenerateHiringDashboardUseCase(container.resolve('AnalyticsService'))
  );

  container.register(
    'GenerateJobReportUseCase',
    () => new GenerateJobReportUseCase(
        container.resolve('JobRepository'),
        container.resolve('EvaluationRepository'),
        container.resolve('CandidateRepository'),
        container.resolve('AnalyticsService')
    )
  );

  container.register(
    'ExportCandidateDataUseCase',
    () => new ExportCandidateDataUseCase(
        container.resolve('CandidateRepository'),
        container.resolve('CandidatePipelineStatusRepository'),
        container.resolve('PipelineRepository')
    )
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

  // Auth Use Cases
  container.register(
    'RegisterUserUseCase',
    () => new RegisterUserUseCase(
        container.resolve('UserRepository'),
        container.resolve('AuthService')
    )
  );

  container.register(
    'LoginUseCase',
    () => new LoginUseCase(
        container.resolve('UserRepository'),
        container.resolve('AuthService')
    )
  );

  container.register(
    'RefreshTokenUseCase',
    () => new RefreshTokenUseCase(
        container.resolve('AuthService')
    )
  );

  container.register(
    'ChangePasswordUseCase',
    () => new ChangePasswordUseCase(
        container.resolve('UserRepository')
    )
  );

  container.register(
    'ObserverRegistry',
    () =>
      new ObserverRegistry(
        container.resolve('ResumeRepository'),
        container.resolve('CandidateRepository'),
        container.resolve('CandidatePipelineStatusRepository'),
        container.resolve('SearchService'),
        container.resolve('EventEmitter'),
      ),
  );

  container.resolve<ObserverRegistry>('ObserverRegistry').registerAll();

  // Initialize Scheduled Jobs (non-critical - don't crash if Redis is unavailable)
  try {
    const scheduledAnalytics = new ScheduledAnalyticsService(
      container.resolve('GenerateHiringDashboardUseCase'),
      container.resolve('AnalyticsService')
    );
    scheduledAnalytics.start();
  } catch (e) {
    console.warn('⚠️ Scheduled Analytics disabled (Redis not available)');
  }

  // Initialize Background Workers (non-critical)
  try {
    new FileProcessorWorker();
  } catch (e) {
    console.warn('⚠️ FileProcessorWorker disabled (Redis not available)');
  }
  
  // Initialize Maintenance Jobs (non-critical)
  try {
    new CleanupOrphanedFilesJob().start();
  } catch (e) {
    console.warn('⚠️ CleanupOrphanedFilesJob disabled (Redis not available)');
  }

  return container;
};
