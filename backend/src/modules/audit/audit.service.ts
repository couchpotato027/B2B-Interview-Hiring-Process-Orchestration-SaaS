import { prisma } from '../../infrastructure/database/prisma.client';

export class AuditService {
    async log(tenantId: string, userId: string | null, action: string, entityType: string, entityId: string, metadata?: any) {
        return prisma.auditLog.create({
            data: { tenantId, userId, action, entityType, entityId, metadata },
        });
    }

    async getAuditLogs(tenantId: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
            }),
            prisma.auditLog.count({ where: { tenantId } }),
        ]);
        return { logs, total, page, limit };
    }
}

export const auditService = new AuditService();
