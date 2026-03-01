import { prisma } from '../../../infrastructure/database/prisma.client';
import { logger } from '../../../infrastructure/logger';

export abstract class PipelineStageExecutor {
    // Template Method: Defines the skeleton of the algorithm
    public async executeStage(candidateId: string, tenantId: string): Promise<boolean> {
        this.auditLog('Stage Execution Started', candidateId);

        try {
            if (!(await this.validatePrerequisites(candidateId, tenantId))) {
                throw new Error('Prerequisites not met for this stage');
            }

            const success = await this.performStageLogic(candidateId, tenantId);

            if (success) {
                await this.onSuccess(candidateId, tenantId);
                return true;
            } else {
                await this.onFailure(candidateId, tenantId);
                return false;
            }
        } catch (error: any) {
            this.auditLog(`Stage Error: ${error.message}`, candidateId);
            return false;
        }
    }

    // Common functionality encapsulated in the base class
    private auditLog(action: string, candidateId: string) {
        logger.info(`[PIPELINE AUDIT] ${action} - Candidate: ${candidateId}`);
    }

    // Steps to be implemented by concrete subclasses
    protected abstract validatePrerequisites(candidateId: string, tenantId: string): Promise<boolean>;
    protected abstract performStageLogic(candidateId: string, tenantId: string): Promise<boolean>;

    // Hooks (Optional overrides)
    protected async onSuccess(candidateId: string, tenantId: string): Promise<void> {
        // Default hook implementation
    }

    protected async onFailure(candidateId: string, tenantId: string): Promise<void> {
        // Default hook implementation
    }
}

// Concrete Class Example
export class BackgroundCheckStageExecutor extends PipelineStageExecutor {
    protected async validatePrerequisites(candidateId: string, tenantId: string): Promise<boolean> {
        const candidate = await prisma.candidate.findUnique({ where: { id: candidateId, tenantId } });
        return !!candidate;
    }

    protected async performStageLogic(candidateId: string, tenantId: string): Promise<boolean> {
        // In a real application, call a 3rd party API (e.g., Checkr)
        logger.info(`Running background check for ${candidateId}`);
        return true; // Mock true for success
    }

    protected async onSuccess(candidateId: string, tenantId: string): Promise<void> {
        // Update candidate status or store report
        logger.info(`Background check cleared for ${candidateId}`);
    }
}
