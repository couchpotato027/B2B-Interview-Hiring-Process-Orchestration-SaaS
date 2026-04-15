import { prisma } from '../../infrastructure/database/prisma.client';

export class GetPipelinesUseCase {
  async execute(organizationId: string) {
    const pipelines = await prisma.pipelineTemplate.findMany({
      where: { tenantId: organizationId },
      include: {
        stages: {
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: { candidates: true, jobs: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return pipelines.map(p => ({
      id: p.id,
      name: p.name,
      roleType: p.roleType,
      isActive: p.isActive,
      stageCount: p.stages.length,
      candidateCount: p._count.candidates,
      jobCount: p._count.jobs,
      stages: p.stages.map(s => ({
        id: s.id,
        name: s.name,
        orderIndex: s.orderIndex,
        stageType: s.stageType
      }))
    }));
  }
}
