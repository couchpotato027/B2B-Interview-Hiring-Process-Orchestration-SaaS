import type { Candidate } from '../../domain/entities/Candidate';
import type { Evaluation } from '../../domain/entities/Evaluation';
import type { Resume } from '../../domain/entities/Resume';
import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import type { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import type { IResumeRepository } from '../../domain/repositories/IResumeRepository';
import type { Result } from '../../shared/Result';

export interface GetCandidateDetailsInput {
  candidateId: string;
  organizationId: string;
}

export interface CandidateDetails {
  candidate: Candidate;
  resume: Resume | null;
  evaluations: Evaluation[];
}

export interface GetCandidateDetailsDependencies {
  candidateRepository: ICandidateRepository;
  resumeRepository: IResumeRepository;
  evaluationRepository: IEvaluationRepository;
}

export class GetCandidateDetailsUseCase {
  constructor(private readonly dependencies: GetCandidateDetailsDependencies) {}

  public async execute(
    input: GetCandidateDetailsInput,
  ): Promise<Result<CandidateDetails>> {
    const candidate = await this.dependencies.candidateRepository.findById(input.candidateId, input.organizationId);

    if (!candidate) {
      return {
        success: false,
        error: `Candidate ${input.candidateId} not found.`,
        code: 'CANDIDATE_NOT_FOUND',
      };
    }

    const latestResume = await this.dependencies.resumeRepository.findByCandidateId(candidate.getId(), input.organizationId);
    const evaluations = await this.dependencies.evaluationRepository.findByCandidateId(
      candidate.getId(),
      input.organizationId
    );

    return {
      success: true,
      data: {
        candidate,
        resume: latestResume,
        evaluations,
      },
    };
  }
}
