import type { Candidate } from '../../domain/entities/Candidate';
import type { Evaluation } from '../../domain/entities/Evaluation';
import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import type { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import type { IJobRepository } from '../../domain/repositories/IJobRepository';
import type { CandidateRankedEvent } from '../../domain/events/DomainEvents';
import { EventEmitter } from '../../infrastructure/events/EventEmitter';
import type { Result } from '../../shared/Result';

export interface RankCandidatesForJobInput {
  jobId: string;
  organizationId: string;
}

export interface RankedCandidate {
  candidate: Candidate;
  evaluation: Evaluation;
  rank: number;
}

export interface RankCandidatesForJobDependencies {
  candidateRepository: ICandidateRepository;
  jobRepository: IJobRepository;
  evaluationRepository: IEvaluationRepository;
  eventEmitter?: EventEmitter;
}

export class RankCandidatesForJobUseCase {
  private readonly eventEmitter: EventEmitter;

  constructor(private readonly dependencies: RankCandidatesForJobDependencies) {
    this.eventEmitter = dependencies.eventEmitter ?? EventEmitter.getInstance();
  }

  public async execute(
    input: RankCandidatesForJobInput,
  ): Promise<Result<RankedCandidate[]>> {
    const job = await this.dependencies.jobRepository.findById(input.jobId, input.organizationId);
    if (!job) {
      return {
        success: false,
        error: `Job ${input.jobId} not found.`,
        code: 'JOB_NOT_FOUND',
      };
    }

    const evaluations = await this.dependencies.evaluationRepository.findByJobId(job.getId(), input.organizationId);
    if (evaluations.length === 0) {
      return {
        success: false,
        error: `No candidates have been evaluated for job ${job.getId()}.`,
        code: 'NO_EVALUATIONS_FOUND',
      };
    }

    const rankedCandidates = await Promise.all(
      [...evaluations]
        .sort((left, right) => right.getOverallScore() - left.getOverallScore())
        .map(async (evaluation, index) => {
          const candidate = await this.dependencies.candidateRepository.findById(
            evaluation.getCandidateId(),
            input.organizationId
          );

          if (!candidate) {
            throw new Error(`Candidate ${evaluation.getCandidateId()} not found.`);
          }

          return {
            candidate,
            evaluation,
            rank: index + 1,
          };
        }),
    );

    await Promise.all(
      rankedCandidates.map(async (rankedCandidate) => {
        const candidateRankedEvent: CandidateRankedEvent = {
          eventType: 'CandidateRankedEvent',
          timestamp: new Date(),
          payload: {
            jobId: job.getId(),
            candidateId: rankedCandidate.candidate.getId(),
            organizationId: input.organizationId,
            rank: rankedCandidate.rank,
            timestamp: new Date(),
          },
        };

        await this.eventEmitter.emit(candidateRankedEvent);
      }),
    );

    return {
      success: true,
      data: rankedCandidates,
    };
  }
}
