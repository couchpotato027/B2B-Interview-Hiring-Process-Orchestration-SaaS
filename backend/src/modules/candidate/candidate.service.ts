import { prisma } from '../../infrastructure/database/prisma.client';
import { CandidateContext, ActiveState, RejectedState } from './patterns/candidate.state';

export class CandidateService {
    async addCandidate(tenantId: string, data: { firstName: string; lastName: string; email: string; pipelineId: string; initialStageId: string }) {
        const candidate = await prisma.candidate.create({
            data: {
                tenantId,
                pipelineId: data.pipelineId,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                currentStageId: data.initialStageId,
                status: 'ACTIVE',
            },
        });

        return candidate;
    }

    async moveCandidateStage(tenantId: string, candidateId: string, newStageId: string) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId, tenantId },
        });

        if (!candidate) throw new Error('Candidate not found');

        // Instantiate context with appropriate state based on current status
        const initialState = candidate.status === 'REJECTED' ? new RejectedState() : new ActiveState();
        const context = new CandidateContext(candidate, initialState);

        await context.advanceStage(tenantId, newStageId);

        return prisma.candidate.findUnique({ where: { id: candidateId } });
    }

    async rejectCandidate(tenantId: string, candidateId: string) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId, tenantId },
        });

        if (!candidate) throw new Error('Candidate not found');

        const initialState = candidate.status === 'REJECTED' ? new RejectedState() : new ActiveState();
        const context = new CandidateContext(candidate, initialState);

        await context.reject(tenantId);

        return prisma.candidate.findUnique({ where: { id: candidateId } });
    }
}
