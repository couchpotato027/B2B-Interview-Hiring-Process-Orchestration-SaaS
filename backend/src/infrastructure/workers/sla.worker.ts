import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../database/prisma.client';
import { NotificationEventBus, SlackAlertObserver, EmailAlertObserver } from '../../modules/notification/patterns/notification.observer';
import { logger } from '../logging/logger';

let slaWorkerInstance: Worker | null = null;

try {
  const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy: () => null,
  });
  redisConnection.on('error', () => {}); // Suppress unhandled errors

  // Initialize Observers
  const eventBus = NotificationEventBus.getInstance();
  eventBus.attach(new SlackAlertObserver());
  eventBus.attach(new EmailAlertObserver());

  slaWorkerInstance = new Worker(
      'sla-monitoring-queue',
      async (job: Job) => {
          const { candidateId, stageId, tenantId } = job.data;

          const candidate = await prisma.candidate.findUnique({
              where: { id: candidateId, tenantId },
              include: { currentStage: true },
          });

          if (!candidate || candidate.currentStageId !== stageId) {
              return;
          }

          const message = `Candidate ${candidate.firstName} ${candidate.lastName} has exceeded SLA time in stage ${candidate.currentStage?.name}.`;

          const alert = await prisma.slaAlert.create({
              data: {
                  tenantId,
                  candidateId,
                  stageId,
                  alertMessage: message,
              },
          });

          eventBus.notify({
              type: 'SLA_VIOLATION',
              tenantId,
              payload: alert,
          });

          logger.warn(`SLA Violation recorded for candidate ${candidateId}`);
      },
      { connection: redisConnection as any }
  );

  slaWorkerInstance.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed with error ${err.message}`);
  });
} catch {
  console.warn('⚠️ SLA Worker: Redis not available, worker disabled');
}

export const slaWorker = slaWorkerInstance;
