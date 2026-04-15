import { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { ICandidatePipelineStatusRepository } from '../../domain/repositories/ICandidatePipelineStatusRepository';
import { IPipelineRepository } from '../../domain/repositories/IPipelineRepository';

export interface ExportFilters {
  jobId?: string;
  stageId?: string;
  status?: string;
}

export class ExportCandidateDataUseCase {
  constructor(
    private readonly candidateRepository: ICandidateRepository,
    private readonly statusRepository: ICandidatePipelineStatusRepository,
    private readonly pipelineRepository: IPipelineRepository
  ) {}

  async execute(organizationId: string, filters: ExportFilters = {}): Promise<string> {
    let candidates = await this.candidateRepository.findAll(organizationId);

    if (filters.status) {
        candidates = candidates.filter(c => c.getStatus() === filters.status);
    }

    const headers = ['Name', 'Email', 'Skills', 'Years of Experience', 'Education', 'Status', 'Current Stage'];
    const rows = await Promise.all(
      candidates.map(async (c) => {
        const status = await this.statusRepository.findByCandidateId(c.getId(), organizationId);
        let stageName = 'N/A';
        
        if (status) {
            const pipeline = await this.pipelineRepository.findById(status.getPipelineId(), organizationId);
            const stage = pipeline?.getStageById(status.getCurrentStageId());
            stageName = stage?.getName() || 'Unknown';
        }

        return [
          c.getName(),
          c.getEmail(),
          `"${c.getSkills().join(', ')}"`,
          c.getYearsOfExperience(),
          c.getEducation(),
          c.getStatus(),
          stageName
        ].join(',');
      })
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
