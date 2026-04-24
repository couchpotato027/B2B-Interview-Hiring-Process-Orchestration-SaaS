import { prisma } from '../../infrastructure/database/prisma.client';

export interface AuditLogData {
  tenantId: string;
  userId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'LOGIN' | 'STAGE_TRANSITION' | 'BULK_UPDATE';
  resource: 'Candidate' | 'Job' | 'Evaluation' | 'Pipeline' | 'User' | 'Settings';
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  private static instance: AuditService;

  private constructor() {}

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          changes: data.changes || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // In production, we might want to log to a secondary store or alerting system
    }
  }

  async getLogs(tenantId: string, filters: any) {
    const { userId, action, resource, resourceId, startDate, endDate, skip = 0, take = 50 } = filters;

    const where: any = { tenantId };
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (resourceId) where.resourceId = resourceId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }
      }),
      prisma.auditLog.count({ where })
    ]);

    return { logs, total };
  }
}

export const auditService = AuditService.getInstance();
