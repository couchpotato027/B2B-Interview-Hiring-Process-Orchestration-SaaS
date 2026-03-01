import { prisma } from '../../../infrastructure/database/prisma.client';
import { Candidate, PipelineStage } from '@prisma/client';

export interface ICandidateState {
    enterState(candidate: Candidate, tenantId: string): Promise<void>;
    nextStage(candidate: Candidate, tenantId: string, nextStageId: string): Promise<void>;
    reject(candidate: Candidate, tenantId: string, reason?: string): Promise<void>;
}

export class CandidateContext {
    private state: ICandidateState;
    private candidate: Candidate;

    constructor(candidate: Candidate, initialState: ICandidateState) {
        this.candidate = candidate;
        this.state = initialState;
    }

    public async transitionTo(state: ICandidateState, tenantId: string): Promise<void> {
        this.state = state;
        await this.state.enterState(this.candidate, tenantId);
    }

    public async advanceStage(tenantId: string, nextStageId: string): Promise<void> {
        await this.state.nextStage(this.candidate, tenantId, nextStageId);
    }

    public async reject(tenantId: string, reason?: string): Promise<void> {
        await this.state.reject(this.candidate, tenantId, reason);
    }
}

export class ActiveState implements ICandidateState {
    async enterState(candidate: Candidate, tenantId: string): Promise<void> {
        // Audit logs or SLA events could be dispatched here
        await prisma.candidate.update({
            where: { id: candidate.id, tenantId },
            data: { status: 'ACTIVE', stageEnteredAt: new Date() },
        });
    }

    async nextStage(candidate: Candidate, tenantId: string, nextStageId: string): Promise<void> {
        // Only ACTIVE candidates can transition stages
        await prisma.candidate.update({
            where: { id: candidate.id, tenantId },
            data: { currentStageId: nextStageId, stageEnteredAt: new Date() },
        });
        // Real implementation would re-instantiate CandidateContext if different states per stage existed
    }

    async reject(candidate: Candidate, tenantId: string, reason?: string): Promise<void> {
        // Transition to Rejected
        const rejectedState = new RejectedState();
        await rejectedState.enterState(candidate, tenantId);
    }
}

export class RejectedState implements ICandidateState {
    async enterState(candidate: Candidate, tenantId: string): Promise<void> {
        await prisma.candidate.update({
            where: { id: candidate.id, tenantId },
            data: { status: 'REJECTED' },
        });
    }

    async nextStage(candidate: Candidate, tenantId: string, nextStageId: string): Promise<void> {
        throw new Error('Cannot advance a candidate that has been rejected.');
    }

    async reject(candidate: Candidate, tenantId: string, reason?: string): Promise<void> {
        throw new Error('Candidate is already rejected.');
    }
}
