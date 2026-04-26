import { Candidate } from '../../domain/entities/Candidate';
import { Resume } from '../../domain/entities/Resume';
import { Evaluation } from '../../domain/entities/Evaluation';
import { EvaluationTransformer, EvaluationDTO } from './EvaluationTransformer';

export interface CandidateDTO {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  yearsOfExperience: number;
  education: string;
  status: string;
  pipelineId: string;
  currentStageId: string;
  resumeUrl: string | null;
  stageHistory: any[];
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
  assignedRecruiterId?: string;
  score: number;
}

export interface CandidateDetailsDTO {
  candidate: CandidateDTO;
  resume: any | null; // Simplfying for now
  evaluations: EvaluationDTO[];
}

export class CandidateTransformer {
  public static toDTO(candidate: Candidate): CandidateDTO {
    const name = candidate.getName();
    const [firstName, ...lastNames] = name.split(' ');
    const lastName = lastNames.join(' ') || '';

    return {
      id: candidate.getId(),
      name: name,
      firstName: firstName || name,
      lastName: lastName,
      email: candidate.getEmail(),
      phone: candidate.getPhone(),
      summary: candidate.getSummary(),
      skills: candidate.getSkills(),
      yearsOfExperience: candidate.getYearsOfExperience(),
      education: candidate.getEducation().map(e => `${e.degree} at ${e.institution}`).join(', '),
      status: candidate.getStatus(),
      pipelineId: candidate.getPipelineId(),
      currentStageId: candidate.getCurrentStageId(),
      resumeUrl: candidate.getResumeUrl() || null,
      stageHistory: candidate.getStageHistory() || [],
      projects: candidate.getProjects().map(p => ({
        title: p.title,
        description: p.description,
        technologies: p.technologies,
      })),
      assignedRecruiterId: candidate.getAssignedRecruiterId() || undefined,
      score: candidate.getScore(),
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
