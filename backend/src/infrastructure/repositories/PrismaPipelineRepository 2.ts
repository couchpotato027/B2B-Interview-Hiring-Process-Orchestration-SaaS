import { PrismaClient } from '@prisma/client';
import { IPipelineRepository } from '../../domain/repositories/IPipelineRepository';
import { Pipeline } from '../../domain/entities/Pipeline';
import { PipelineStage } from '../../domain/entities/PipelineStage';

export class PrismaPipelineRepository implements IPipelineRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async save(pipeline: Pipeline): Promise<void> {
    await this.prisma.pipelineTemplate.upsert({
      where: { id: pipeline.getId() },
      update: {
        name: pipeline.getName(),
        roleType: 'ENGINEERING', // mapping detail
      },
      create: {
        id: pipeline.getId(),
        tenantId: pipeline.getOrganizationId(),
        name: pipeline.getName(),
        roleType: 'ENGINEERING',
      },
    });

    for (const stage of pipeline.getStages()) {
      await this.prisma.pipelineStage.upsert({
        where: { id: stage.getId() },
        update: {
          name: stage.getName(),
          orderIndex: stage.getOrder(),
        },
        create: {
          id: stage.getId(),
          tenantId: pipeline.getOrganizationId(),
          pipelineTemplateId: pipeline.getId(),
          name: stage.getName(),
          orderIndex: stage.getOrder(),
        },
      });
    }
  }

  async findById(id: string, organizationId: string): Promise<Pipeline | null> {
    const model = await this.prisma.pipelineTemplate.findFirst({
      where: { id, tenantId: organizationId },
      include: { stages: true },
    });

    if (!model) return null;

    return this.mapToEntity(model);
  }

  async findByJobId(jobId: string, organizationId: string): Promise<Pipeline | null> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId: organizationId },
      include: { 
        pipelineTemplate: {
          include: { stages: true }
        }
      }
    });

    if (!job || !job.pipelineTemplate) return null;

    return this.mapToEntity(job.pipelineTemplate);
  }

  async findAll(organizationId: string): Promise<Pipeline[]> {
    const models = await this.prisma.pipelineTemplate.findMany({
      where: { tenantId: organizationId },
      include: { stages: true },
    });

    return models.map(this.mapToEntity);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.pipelineTemplate.delete({
      where: { id },
    });
  }

  private mapToEntity(model: any): Pipeline {
    const stages = (model.stages || []).map((s: any) => new PipelineStage({
      id: s.id,
      name: s.name,
      order: s.orderIndex,
      type: 'custom',
    }));

    return new Pipeline({
      id: model.id,
      organizationId: model.tenantId,
      name: model.name,
      stages,
      jobId: '', // Defaulting for now
      isActive: true,
      createdAt: model.createdAt || new Date(),
    });
  }
}
