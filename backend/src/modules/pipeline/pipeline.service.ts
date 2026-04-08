import { prisma } from '../../infrastructure/database/prisma.client';
import { BackgroundCheckStageExecutor } from './patterns/pipeline.template';

export class PipelineService {
    async createPipelineTemplate(tenantId: string, name: string, roleType: string, stages: { name: string; orderIndex: number; slaHours: number; stageType?: string }[]) {
        const pipeline = await prisma.pipelineTemplate.create({
            data: {
                tenantId,
                name,
                roleType,
                stages: {
                    create: stages.map(s => ({
                        tenantId,
                        name: s.name,
                        orderIndex: s.orderIndex,
                        slaHours: s.slaHours,
                        stageType: s.stageType || 'INTERVIEW',
                    })),
                },
            },
            include: { stages: { orderBy: { orderIndex: 'asc' } } },
        });

        return pipeline;
    }

    async listPipelines(tenantId: string) {
        return prisma.pipelineTemplate.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                stages: { orderBy: { orderIndex: 'asc' } },
                _count: { select: { candidates: true, jobs: true } },
            },
        });
    }

    async getPipeline(tenantId: string, pipelineId: string) {
        const pipeline = await prisma.pipelineTemplate.findFirst({
            where: { id: pipelineId, tenantId },
            include: {
                stages: { orderBy: { orderIndex: 'asc' }, include: { _count: { select: { candidates: true } } } },
                candidates: {
                    include: { currentStage: { select: { id: true, name: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!pipeline) throw { statusCode: 404, message: 'Pipeline not found' };
        return pipeline;
    }

    async updatePipeline(tenantId: string, pipelineId: string, data: { name?: string; roleType?: string; isActive?: boolean }) {
        const pipeline = await prisma.pipelineTemplate.findFirst({ where: { id: pipelineId, tenantId } });
        if (!pipeline) throw { statusCode: 404, message: 'Pipeline not found' };

        return prisma.pipelineTemplate.update({
            where: { id: pipelineId },
            data,
            include: { stages: { orderBy: { orderIndex: 'asc' } } },
        });
    }

    async deletePipeline(tenantId: string, pipelineId: string) {
        const pipeline = await prisma.pipelineTemplate.findFirst({ where: { id: pipelineId, tenantId } });
        if (!pipeline) throw { statusCode: 404, message: 'Pipeline not found' };

        // Check if any candidates are using this pipeline
        const candidateCount = await prisma.candidate.count({ where: { pipelineId } });
        if (candidateCount > 0) {
            throw { statusCode: 400, message: 'Cannot delete pipeline with active candidates' };
        }

        await prisma.pipelineStage.deleteMany({ where: { pipelineTemplateId: pipelineId } });
        await prisma.pipelineTemplate.delete({ where: { id: pipelineId } });
        return { success: true };
    }

    async reorderStages(tenantId: string, pipelineId: string, stageOrder: { stageId: string; orderIndex: number }[]) {
        const pipeline = await prisma.pipelineTemplate.findFirst({ where: { id: pipelineId, tenantId } });
        if (!pipeline) throw { statusCode: 404, message: 'Pipeline not found' };

        // Use a transaction to update all stage orders atomically
        // First set all to negative to avoid unique constraint violations
        await prisma.$transaction(async (tx) => {
            for (const item of stageOrder) {
                await tx.pipelineStage.update({
                    where: { id: item.stageId },
                    data: { orderIndex: -(item.orderIndex + 1000) },
                });
            }
            for (const item of stageOrder) {
                await tx.pipelineStage.update({
                    where: { id: item.stageId },
                    data: { orderIndex: item.orderIndex },
                });
            }
        });

        return prisma.pipelineTemplate.findFirst({
            where: { id: pipelineId, tenantId },
            include: { stages: { orderBy: { orderIndex: 'asc' } } },
        });
    }

    async addStage(tenantId: string, pipelineId: string, data: { name: string; orderIndex: number; slaHours?: number; stageType?: string }) {
        const pipeline = await prisma.pipelineTemplate.findFirst({ where: { id: pipelineId, tenantId } });
        if (!pipeline) throw { statusCode: 404, message: 'Pipeline not found' };

        return prisma.pipelineStage.create({
            data: {
                tenantId,
                pipelineTemplateId: pipelineId,
                name: data.name,
                orderIndex: data.orderIndex,
                slaHours: data.slaHours || 48,
                stageType: data.stageType || 'INTERVIEW',
            },
        });
    }

    async deleteStage(tenantId: string, stageId: string) {
        const stage = await prisma.pipelineStage.findFirst({ where: { id: stageId, tenantId } });
        if (!stage) throw { statusCode: 404, message: 'Stage not found' };

        const candidateCount = await prisma.candidate.count({ where: { currentStageId: stageId } });
        if (candidateCount > 0) {
            throw { statusCode: 400, message: 'Cannot delete stage with active candidates' };
        }

        await prisma.pipelineStage.delete({ where: { id: stageId } });
        return { success: true };
    }

    async executeAutomatedStage(tenantId: string, candidateId: string, stageType: string) {
        if (stageType === 'BACKGROUND_CHECK') {
            const executor = new BackgroundCheckStageExecutor();
            return await executor.executeStage(candidateId, tenantId);
        }
        throw new Error('Unsupported automated stage');
    }
}
