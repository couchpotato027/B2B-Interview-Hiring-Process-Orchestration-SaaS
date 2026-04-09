import { Candidate } from '../../domain/entities/Candidate';
import { Resume } from '../../domain/entities/Resume';
import { Evaluation } from '../../domain/entities/Evaluation';
import { EvaluationTransformer, EvaluationDTO } from './EvaluationTransformer';

export interface CandidateDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  yearsOfExperience: number;
  education: string;
  status: string;
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
}

export interface CandidateDetailsDTO {
  candidate: CandidateDTO;
  resume: any | null; // Simplfying for now
  evaluations: EvaluationDTO[];
}

export class CandidateTransformer {
  public static toDTO(candidate: Candidate): CandidateDTO {
    return {
      id: candidate.getId(),
      name: candidate.getName(),
      email: candidate.getEmail(),
      phone: candidate.getPhone(),
      skills: candidate.getSkills(),
      yearsOfExperience: candidate.getYearsOfExperience(),
      education: candidate.getEducation(),
      status: candidate.getStatus(),
      projects: candidate.getProjects().map(p => ({
        title: p.title,
        description: p.description,
        technologies: p.technologies,
      })),
    };
  }

  public static toDetailedDTO(details: { candidate: Candidate; resume: Resume | null; evaluations?: Evaluation[] }): CandidateDetailsDTO {
    return {
      candidate: this.toDTO(details.candidate),
      resume: details.resume ? {
        id: details.resume.getId(),
        fileName: details.resume.getFileName(),
        uploadedAt: details.resume.getUploadedAt().toISOString(),
      } : null,
      evaluations: EvaluationTransformer.toCollectionDTO(details.evaluations ?? []),
    };
  }

  public static toCollectionDTO(candidates: Candidate[]): CandidateDTO[] {
    return candidates.map(c => this.toDTO(c));
  }
}
