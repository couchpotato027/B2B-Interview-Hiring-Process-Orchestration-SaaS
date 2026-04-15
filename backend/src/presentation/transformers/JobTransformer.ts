import { Job } from '../../domain/entities/Job';

export interface JobDTO {
  id: string;
  title: string;
  department: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredExperience: number;
  status: string;
  _count: {
    candidates: number;
  };
}

export class JobTransformer {
  public static toDTO(job: Job): JobDTO {
    return {
      id: job.getId(),
      title: job.getTitle(),
      department: job.getDepartment(),
      description: job.getDescription(),
      requiredSkills: job.getRequiredSkills(),
      preferredSkills: job.getPreferredSkills(),
      requiredExperience: job.getRequiredExperience(),
      status: job.getStatus(),
      _count: {
        candidates: (job as any).candidateCount || 0, // Fallback to 0 if not provided
      },
    };
  }

  public static toCollectionDTO(jobs: Job[]): JobDTO[] {
    return jobs.map(j => this.toDTO(j));
  }
}
