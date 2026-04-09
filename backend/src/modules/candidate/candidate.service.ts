import { prisma } from '../../infrastructure/database/prisma.client';
import { CandidateContext, ActiveState, RejectedState, HiredState } from './patterns/candidate.state';
import { NotFoundError } from '../../shared/errors/DomainErrors';
import { scheduleSlaCheck, cancelSlaCheck } from '../../infrastructure/queue/bullmq.setup';

export class CandidateService {
    async addCandidate(tenantId: string, data: { firstName: string; lastName: string; email: string; pipelineId: string; initialStageId: string; jobId?: string; resumeUrl?: string }) {
        const stage = await prisma.pipelineStage.findFirst({ where: { id: data.initialStageId, tenantId } });

        const candidate = await prisma.candidate.create({
            data: {
                tenantId,
                pipelineId: data.pipelineId,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                currentStageId: data.initialStageId,
                jobId: data.jobId || null,
                resumeUrl: data.resumeUrl || null,
                status: 'ACTIVE',
            },
            include: { currentStage: true, pipeline: true },
        });

        // Schedule SLA check for the initial stage
        if (stage) {
            const delayMs = stage.slaHours * 60 * 60 * 1000;
            await scheduleSlaCheck(candidate.id, data.initialStageId, tenantId, delayMs).catch(() => {});
        }

        return candidate;
    }

    async listCandidates(tenantId: string, filters?: { status?: string; pipelineId?: string; jobId?: string }) {
        return prisma.candidate.findMany({
            where: {
                tenantId,
                ...(filters?.status ? { status: filters.status } : {}),
                ...(filters?.pipelineId ? { pipelineId: filters.pipelineId } : {}),
                ...(filters?.jobId ? { jobId: filters.jobId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: {
                currentStage: { select: { id: true, name: true, orderIndex: true } },
                pipeline: { select: { id: true, name: true, roleType: true } },
                job: { select: { id: true, title: true } },
            },
        });
    }

    async getCandidate(tenantId: string, candidateId: string) {
        const candidate = await prisma.candidate.findFirst({
            where: { id: candidateId, tenantId },
            include: {
                currentStage: true,
                pipeline: { include: { stages: { orderBy: { orderIndex: 'asc' } } } },
                job: { select: { id: true, title: true } },
                evaluations: {
                    include: { interviewer: { select: { firstName: true, lastName: true, email: true } }, stage: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                decisions: { orderBy: { createdAt: 'desc' } },
                interviews: {
                    include: { interviewer: { select: { firstName: true, lastName: true, email: true } }, stage: { select: { name: true } } },
                    orderBy: { scheduledAt: 'desc' },
                },
                slaAlerts: { orderBy: { createdAt: 'desc' } },
            },
        });
        if (!candidate) throw new NotFoundError('Candidate not found');
        return candidate;
    }

    async updateCandidate(tenantId: string, candidateId: string, data: { firstName?: string; lastName?: string; email?: string; resumeUrl?: string }) {
        const candidate = await prisma.candidate.findFirst({ where: { id: candidateId, tenantId } });
        if (!candidate) throw new NotFoundError('Candidate not found');

        return prisma.candidate.update({
            where: { id: candidateId },
            data,
            include: { currentStage: true, pipeline: true },
        });
    }

    async deleteCandidate(tenantId: string, candidateId: string) {
        const candidate = await prisma.candidate.findFirst({ where: { id: candidateId, tenantId } });
        if (!candidate) throw new NotFoundError('Candidate not found');

        await prisma.candidate.delete({ where: { id: candidateId } });
        return { success: true };
    }

    async moveCandidateStage(tenantId: string, candidateId: string, newStageId: string) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId, tenantId },
        });

        if (!candidate) throw new NotFoundError('Candidate not found');

        // Cancel existing SLA check for old stage
        if (candidate.currentStageId) {
            await cancelSlaCheck(candidateId, candidate.currentStageId).catch(() => {});
        }

        // Instantiate context with appropriate state based on current status
        const initialState = candidate.status === 'REJECTED' ? new RejectedState() : candidate.status === 'HIRED' ? new HiredState() : new ActiveState();
        const context = new CandidateContext(candidate, initialState);

        await context.advanceStage(tenantId, newStageId);

        // Schedule SLA check for new stage
        const newStage = await prisma.pipelineStage.findFirst({ where: { id: newStageId, tenantId } });
        if (newStage) {
            const delayMs = newStage.slaHours * 60 * 60 * 1000;
            await scheduleSlaCheck(candidateId, newStageId, tenantId, delayMs).catch(() => {});
        }

        return prisma.candidate.findUnique({
            where: { id: candidateId },
            include: { currentStage: true, pipeline: true },
        });
    }

    async rejectCandidate(tenantId: string, candidateId: string) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId, tenantId },
        });

        if (!candidate) throw new NotFoundError('Candidate not found');

        // Cancel SLA check
        if (candidate.currentStageId) {
            await cancelSlaCheck(candidateId, candidate.currentStageId).catch(() => {});
        }

        const initialState = candidate.status === 'REJECTED' ? new RejectedState() : new ActiveState();
        const context = new CandidateContext(candidate, initialState);

        await context.reject(tenantId);

        return prisma.candidate.findUnique({ where: { id: candidateId }, include: { currentStage: true } });
    }

    async hireCandidate(tenantId: string, candidateId: string) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId, tenantId },
        });

        if (!candidate) throw new NotFoundError('Candidate not found');

        // Cancel SLA check
        if (candidate.currentStageId) {
            await cancelSlaCheck(candidateId, candidate.currentStageId).catch(() => {});
        }

        const initialState = candidate.status === 'REJECTED' ? new RejectedState() : new ActiveState();
        const context = new CandidateContext(candidate, initialState);

        await context.hire(tenantId);

        return prisma.candidate.findUnique({ where: { id: candidateId }, include: { currentStage: true } });
    }
}
