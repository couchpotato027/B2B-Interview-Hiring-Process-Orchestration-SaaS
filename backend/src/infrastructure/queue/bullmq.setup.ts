// Redis/BullMQ is OPTIONAL — only connect if REDIS_URL is explicitly set
const REDIS_URL = process.env.REDIS_URL;

export const scheduleSlaCheck = async (_candidateId: string, _stageId: string, _tenantId: string, _delayMs: number) => {
    if (!REDIS_URL) return; // Redis not configured, skip silently
};

export const cancelSlaCheck = async (_candidateId: string, _stageId: string) => {
    if (!REDIS_URL) return; // Redis not configured, skip silently
};
