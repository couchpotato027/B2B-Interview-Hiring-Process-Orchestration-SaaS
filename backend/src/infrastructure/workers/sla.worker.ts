import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../database/prisma.client';
import { NotificationEventBus, SlackAlertObserver, EmailAlertObserver } from '../../modules/notification/patterns/notification.observer';
import { logger } from '../logging/logger';

// BullMQ workers require maxRetriesPerRequest: null for blocking commands.
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
});

// Initialize Observers
const eventBus = NotificationEventBus.getInstance();
eventBus.attach(new SlackAlertObserver());
eventBus.attach(new EmailAlertObserver());

export const slaWorker = new Worker(
    'sla-monitoring-queue',
    async (job: Job) => {
        const { candidateId, stageId, tenantId } = job.data;

        // Verify if candidate is still in the same stage
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId, tenantId },
            include: { currentStage: true },
        });

        if (!candidate || candidate.currentStageId !== stageId) {
            // Candidate moved on; no SLA violation
            return;
        }

        // SLA Violation occurred
        const message = `Candidate ${candidate.firstName} ${candidate.lastName} has exceeded SLA time in stage ${candidate.currentStage?.name}.`;

        const alert = await prisma.slaAlert.create({
            data: {
                tenantId,
                candidateId,
                stageId,
                alertMessage: message,
            },
        });

        // Notify Observers
        eventBus.notify({
            type: 'SLA_VIOLATION',
            tenantId,
            payload: alert,
        });

        logger.warn(`SLA Violation recorded for candidate ${candidateId}`);
    },
    { connection: redisConnection as any }
);

slaWorker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed with error ${err.message}`);
});
