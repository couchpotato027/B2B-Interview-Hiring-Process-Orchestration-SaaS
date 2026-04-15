import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let redisConnection: IORedis | null = null;
let slaQueueInstance: Queue | null = null;

try {
  redisConnection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    retryStrategy: () => null, // Don't retry — fail gracefully
  });
  redisConnection.on('error', () => {}); // Suppress unhandled error events
  slaQueueInstance = new Queue('sla-monitoring-queue', { connection: redisConnection as any });
} catch {
  console.warn('⚠️ BullMQ/Redis not available — SLA queue disabled');
}

export const slaQueue = slaQueueInstance;

export const scheduleSlaCheck = async (candidateId: string, stageId: string, tenantId: string, delayMs: number) => {
    if (!slaQueue) return;
    await slaQueue.add(
        'check-sla',
        { candidateId, stageId, tenantId },
        { delay: delayMs, jobId: `sla-${candidateId}-${stageId}` }
    );
};

export const cancelSlaCheck = async (candidateId: string, stageId: string) => {
    if (!slaQueue) return;
    const job = await slaQueue.getJob(`sla-${candidateId}-${stageId}`);
    if (job) {
        await job.remove();
    }
};
