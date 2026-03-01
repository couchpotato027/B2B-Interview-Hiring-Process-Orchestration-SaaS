import { prisma } from '../../infrastructure/database/prisma.client';
import { BackgroundCheckStageExecutor } from './patterns/pipeline.template';

export class PipelineService {
    async createPipelineTemplate(tenantId: string, name: string, roleType: string, stages: { name: string; orderIndex: number; slaHours: number }[]) {
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
                    })),
                },
            },
            include: { stages: true },
        });

        return pipeline;
    }

    async executeAutomatedStage(tenantId: string, candidateId: string, stageType: string) {
        // The Factory / Dispatcher invoking the Template Method
        if (stageType === 'BACKGROUND_CHECK') {
            const executor = new BackgroundCheckStageExecutor();
            return await executor.executeStage(candidateId, tenantId);
        }

        throw new Error('Unsupported automated stage');
    }
}
