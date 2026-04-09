import { prisma } from '../../../infrastructure/database/prisma.client';
import { Candidate } from '@prisma/client';
import { ConflictError } from '../../../shared/errors/DomainErrors';

export interface ICandidateState {
    enterState(candidate: Candidate, tenantId: string): Promise<void>;
    nextStage(candidate: Candidate, tenantId: string, nextStageId: string): Promise<void>;
    reject(candidate: Candidate, tenantId: string, reason?: string): Promise<void>;
    hire(candidate: Candidate, tenantId: string): Promise<void>;
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

    public async hire(tenantId: string): Promise<void> {
        await this.state.hire(this.candidate, tenantId);
    }
}

export class ActiveState implements ICandidateState {
    async enterState(candidate: Candidate, tenantId: string): Promise<void> {
        await prisma.candidate.update({
            where: { id: candidate.id, tenantId },
            data: { status: 'ACTIVE', stageEnteredAt: new Date() },
        });
    }

    async nextStage(candidate: Candidate, tenantId: string, nextStageId: string): Promise<void> {
        await prisma.candidate.update({
            where: { id: candidate.id, tenantId },
            data: { currentStageId: nextStageId, stageEnteredAt: new Date() },
        });
    }

    async reject(candidate: Candidate, tenantId: string, reason?: string): Promise<void> {
        const rejectedState = new RejectedState();
        await rejectedState.enterState(candidate, tenantId);
    }

    async hire(candidate: Candidate, tenantId: string): Promise<void> {
        const hiredState = new HiredState();
        await hiredState.enterState(candidate, tenantId);
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
        throw new ConflictError('Cannot advance a candidate that has been rejected.');
    }

    async reject(candidate: Candidate, tenantId: string, reason?: string): Promise<void> {
        throw new ConflictError('Candidate is already rejected.');
    }

    async hire(candidate: Candidate, tenantId: string): Promise<void> {
        throw new ConflictError('Cannot hire a rejected candidate.');
    }
}

export class HiredState implements ICandidateState {
    async enterState(candidate: Candidate, tenantId: string): Promise<void> {
        await prisma.candidate.update({
            where: { id: candidate.id, tenantId },
            data: { status: 'HIRED', stageEnteredAt: new Date() },
        });
    }

    async nextStage(candidate: Candidate, tenantId: string, nextStageId: string): Promise<void> {
        throw new ConflictError('Cannot advance a hired candidate.');
    }

    async reject(candidate: Candidate, tenantId: string, reason?: string): Promise<void> {
        throw new ConflictError('Cannot reject a hired candidate.');
    }

    async hire(candidate: Candidate, tenantId: string): Promise<void> {
        throw new ConflictError('Candidate is already hired.');
    }
}
