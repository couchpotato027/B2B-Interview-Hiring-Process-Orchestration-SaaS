import { PrismaClient } from '@prisma/client';
import { ICandidatePipelineStatusRepository } from '../../domain/repositories/ICandidatePipelineStatusRepository';
import { CandidatePipelineStatus } from '../../domain/entities/CandidatePipelineStatus';

export class PrismaCandidatePipelineStatusRepository implements ICandidatePipelineStatusRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async save(status: CandidatePipelineStatus): Promise<void> {
    // In this schema, CandidatePipelineStatus is integrated into the Candidate model
    await this.prisma.candidate.update({
      where: { id: status.getCandidateId() },
      data: {
        pipelineId: status.getPipelineId(),
        currentStageId: status.getCurrentStageId(),
        stageEnteredAt: status.getUpdatedAt(),
        stageHistory: status.getStageHistory() as any,
      },
    });
  }

  async findById(id: string, organizationId: string): Promise<CandidatePipelineStatus | null> {
    // Assuming ID passed is candidateId or we need a way to map. 
    // Usually, status ID for a single-pipeline-per-candidate system can be candidateId.
    const candidate = await this.prisma.candidate.findFirst({
      where: { id, tenantId: organizationId },
    });

    if (!candidate) return null;

    return this.mapToEntity(candidate);
  }

  async findByCandidateId(candidateId: string, organizationId: string): Promise<CandidatePipelineStatus | null> {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId: organizationId },
    });

    if (!candidate) return null;

    return this.mapToEntity(candidate);
  }

  async findByPipelineId(pipelineId: string, organizationId: string): Promise<CandidatePipelineStatus[]> {
    const candidates = await this.prisma.candidate.findMany({
      where: { pipelineId, tenantId: organizationId },
    });

    return candidates.map(this.mapToEntity);
  }

  async findByStageId(stageId: string, organizationId: string): Promise<CandidatePipelineStatus[]> {
    const candidates = await this.prisma.candidate.findMany({
      where: { currentStageId: stageId, tenantId: organizationId },
    });

    return candidates.map(this.mapToEntity);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    // Soft delete or status reset? In this schema, we probably just clear the fields.
    await this.prisma.candidate.update({
      where: { id, tenantId: organizationId },
      data: {
        pipelineId: '',
        currentStageId: null,
      },
    });
  }

  private mapToEntity(model: any): CandidatePipelineStatus {
    let stageHistory = [];
    try {
      if (model.stageHistory) {
        stageHistory = typeof model.stageHistory === 'string' 
          ? JSON.parse(model.stageHistory) 
          : model.stageHistory;
      }
    } catch (e) {
      console.error('Failed to parse stage history:', e);
    }

    return new CandidatePipelineStatus({
      id: model.id, 
      candidateId: model.id,
      pipelineId: model.pipelineId || '',
      currentStageId: model.currentStageId || '',
      organizationId: model.tenantId,
      updatedAt: model.stageEnteredAt || new Date(),
      stageHistory: stageHistory,
    });
  }
}
