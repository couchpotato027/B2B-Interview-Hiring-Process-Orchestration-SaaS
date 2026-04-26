import { prisma } from '../../infrastructure/database/prisma.client';
import { Pipeline } from '../../domain/entities/Pipeline';
import { PipelineStage } from '../../domain/entities/PipelineStage';
import { NotFoundError } from '../../shared/errors/NotFoundError';

export interface PipelineBoardStageData {
  stageId: string;
  stageName: string;
  orderIndex: number;
  candidates: Array<{
    id: string;
    name: string;
    email: string;
    timeInStage: number;
    score: number | null;
    assignedRecruiter?: { id: string; firstName: string; lastName: string } | null;
    notes?: string;
  }>;
}

export interface PipelineBoardData {
  pipeline: Pipeline;
  stages: PipelineBoardStageData[];
}

/**
 * GetPipelineBoardUseCase — Retrieves pipeline board data by querying
 * candidates directly from the Candidate table (where they actually live)
 * rather than from a separate CandidatePipelineStatus table.
 */
export class GetPipelineBoardUseCase {
  constructor(
    private readonly _pipelineRepository?: any,
    private readonly _statusRepository?: any,
    private readonly _candidateRepository?: any,
  ) {}

  async execute(pipelineId: string, organizationId: string): Promise<PipelineBoardData> {
    // 1. Get the pipeline with its stages directly from Prisma
    const pipelineData = await prisma.pipelineTemplate.findFirst({
      where: { id: pipelineId, tenantId: organizationId },
      include: {
        stages: { orderBy: { orderIndex: 'asc' } },
      },
    });

    if (!pipelineData) {
      throw new NotFoundError(`Pipeline with ID ${pipelineId} not found`);
    }

    // 2. Build the domain Pipeline entity
    const pipeline = new Pipeline({
      id: pipelineData.id,
      name: pipelineData.name,
      jobId: '', // PipelineTemplate doesn't have a direct jobId
      stages: pipelineData.stages.map(
        (s) =>
          new PipelineStage({
            id: s.id,
            name: s.name,
            order: s.orderIndex,
            type: this.mapStageType(s.stageType),
          }),
      ),
      isActive: pipelineData.isActive,
      organizationId: pipelineData.tenantId,
      createdAt: pipelineData.createdAt,
    });

    // 3. Get all candidates in this pipeline, grouped by stage
    const candidates = await prisma.candidate.findMany({
      where: { pipelineId, tenantId: organizationId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        currentStageId: true,
        stageEnteredAt: true,
        status: true,
        score: true,
        assignedRecruiterId: true,
        assignedRecruiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Build stage data with candidates
    const stages: PipelineBoardStageData[] = pipelineData.stages.map((stage) => {
      const stageCandidates = candidates
        .filter((c) => c.currentStageId === stage.id)
        .map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`.trim(),
          email: c.email,
          timeInStage: Date.now() - new Date(c.stageEnteredAt).getTime(),
          score: c.score,
          assignedRecruiter: c.assignedRecruiter,
          notes: c.status !== 'ACTIVE' ? `Status: ${c.status}` : undefined,
        }));

      return {
        stageId: stage.id,
        stageName: stage.name,
        orderIndex: stage.orderIndex,
        candidates: stageCandidates,
      };
    });

    return { pipeline, stages };
  }

  private mapStageType(dbType: string): 'screening' | 'interview' | 'assessment' | 'offer' | 'custom' | 'rejected' {
    const typeMap: Record<string, 'screening' | 'interview' | 'assessment' | 'offer' | 'custom' | 'rejected'> = {
      STATIC: 'screening',
      INTERVIEW: 'interview',
      ASSESSMENT: 'assessment',
      AUTOMATED: 'custom',
      BACKGROUND_CHECK: 'screening',
      OFFER: 'offer',
      REJECTED: 'rejected',
    };
    return typeMap[dbType] || 'custom';
  }
}
