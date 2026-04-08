import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import type { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import type { IJobRepository } from '../../domain/repositories/IJobRepository';
import type { IResumeRepository } from '../../domain/repositories/IResumeRepository';
import { InMemoryCandidateRepository } from './InMemoryCandidateRepository';
import { InMemoryEvaluationRepository } from './InMemoryEvaluationRepository';
import { InMemoryJobRepository } from './InMemoryJobRepository';
import { InMemoryResumeRepository } from './InMemoryResumeRepository';

export interface RepositoryRegistry {
  candidateRepository: ICandidateRepository;
  jobRepository: IJobRepository;
  resumeRepository: IResumeRepository;
  evaluationRepository: IEvaluationRepository;
}

export class RepositoryFactory {
  private static instance: RepositoryFactory | null = null;

  private readonly repositories: RepositoryRegistry;

  private constructor(repositories?: Partial<RepositoryRegistry>) {
    this.repositories = {
      candidateRepository:
        repositories?.candidateRepository ?? new InMemoryCandidateRepository(),
      jobRepository: repositories?.jobRepository ?? new InMemoryJobRepository(),
      resumeRepository: repositories?.resumeRepository ?? new InMemoryResumeRepository(),
      evaluationRepository:
        repositories?.evaluationRepository ?? new InMemoryEvaluationRepository(),
    };
  }

  public static getInstance(repositories?: Partial<RepositoryRegistry>): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory(repositories);
    }

    return RepositoryFactory.instance;
  }

  public static configure(repositories: Partial<RepositoryRegistry>): RepositoryFactory {
    RepositoryFactory.instance = new RepositoryFactory(repositories);
    return RepositoryFactory.instance;
  }

  public static reset(): void {
    RepositoryFactory.instance = null;
  }

  public getCandidateRepository(): ICandidateRepository {
    return this.repositories.candidateRepository;
  }

  public getJobRepository(): IJobRepository {
    return this.repositories.jobRepository;
  }

  public getResumeRepository(): IResumeRepository {
    return this.repositories.resumeRepository;
  }

  public getEvaluationRepository(): IEvaluationRepository {
    return this.repositories.evaluationRepository;
  }
}
