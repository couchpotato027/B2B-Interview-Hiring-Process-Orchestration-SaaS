import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export const slaQueue = new Queue('sla-monitoring-queue', { connection: redisConnection as any });

export const scheduleSlaCheck = async (candidateId: string, stageId: string, tenantId: string, delayMs: number) => {
    await slaQueue.add(
        'check-sla',
        { candidateId, stageId, tenantId },
        { delay: delayMs, jobId: `sla-${candidateId}-${stageId}` }
    );
};

export const cancelSlaCheck = async (candidateId: string, stageId: string) => {
    const job = await slaQueue.getJob(`sla-${candidateId}-${stageId}`);
    if (job) {
        await job.remove();
    }
};
