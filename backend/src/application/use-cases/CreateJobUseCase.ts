import { randomUUID } from 'crypto';
import { Job } from '../../domain/entities/Job';
import type { IJobRepository } from '../../domain/repositories/IJobRepository';
import type { Result } from '../../shared/Result';

export interface CreateJobInput {
  title: string;
  department: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredExperience: number;
  organizationId: string;
  pipelineTemplateId?: string;
}

export class CreateJobUseCase {
  constructor(private readonly jobRepository: IJobRepository) {}

  public async execute(input: CreateJobInput): Promise<Result<Job>> {
    try {
      const job = new Job({
        id: randomUUID(),
        title: input.title,
        department: input.department,
        description: input.description,
        requiredSkills: input.requiredSkills,
        preferredSkills: input.preferredSkills,
        requiredExperience: input.requiredExperience,
        organizationId: input.organizationId,
        pipelineTemplateId: input.pipelineTemplateId,
        status: 'open',
      });

      const savedJob = await this.jobRepository.save(job);

      return {
        success: true,
        data: savedJob,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create job.',
        code: 'JOB_VALIDATION_FAILED',
      };
    }
  }
}
