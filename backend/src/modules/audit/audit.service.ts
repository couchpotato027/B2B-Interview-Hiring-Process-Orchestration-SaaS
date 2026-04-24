import { prisma } from '../../infrastructure/database/prisma.client';

export class AuditService {
    async log(params: {
        tenantId: string;
        userId: string | null;
        action: string;
        resource: string;
        resourceId?: string;
        changes?: any;
        ipAddress?: string;
        userAgent?: string;
    }) {
        return prisma.auditLog.create({
            data: {
                tenantId: params.tenantId,
                userId: params.userId,
                action: params.action,
                resource: params.resource,
                resourceId: params.resourceId || null,
                changes: params.changes || null,
                ipAddress: params.ipAddress || null,
                userAgent: params.userAgent || null,
            },
        });
    }

    async getAuditLogs(tenantId: string, filters: { userId?: string, action?: string, resource?: string, page?: number, limit?: number } = {}) {
        const { userId, action, resource, page = 1, limit = 50 } = filters;
        const skip = (page - 1) * limit;
        const where: any = { tenantId };
        if (userId) where.userId = userId;
        if (action) where.action = action;
        if (resource) where.resource = resource;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
            }),
            prisma.auditLog.count({ where }),
        ]);
        return { logs, total, page, limit };
    }
}

export const auditService = new AuditService();
