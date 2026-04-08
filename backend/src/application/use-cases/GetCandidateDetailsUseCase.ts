import type { Candidate } from '../../domain/entities/Candidate';
import type { Evaluation } from '../../domain/entities/Evaluation';
import type { Resume } from '../../domain/entities/Resume';
import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import type { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import type { IResumeRepository } from '../../domain/repositories/IResumeRepository';
import type { Result } from '../../shared/Result';

export interface GetCandidateDetailsInput {
  candidateId: string;
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
    const candidate = await this.dependencies.candidateRepository.findById(input.candidateId);

    if (!candidate) {
      return {
        success: false,
        error: `Candidate ${input.candidateId} not found.`,
        code: 'CANDIDATE_NOT_FOUND',
      };
    }

    const resumes = await this.dependencies.resumeRepository.findByCandidateId(candidate.getId());
    const evaluations = await this.dependencies.evaluationRepository.findByCandidateId(
      candidate.getId(),
    );

    const latestResume = [...resumes].sort(
      (left, right) => right.getUploadedAt().getTime() - left.getUploadedAt().getTime(),
    )[0] ?? null;

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
