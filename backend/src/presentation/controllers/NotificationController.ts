import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';
import { prisma } from '../../infrastructure/database/prisma.client';

export class NotificationController extends BaseController {
  
  public getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant';
      const userId = authReq.user?.userId;

      if (!userId) return this.badRequest(res, 'User ID is required');

      const notifications = await prisma.notification.findMany({
        where: { tenantId, userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return this.rawOk(res, notifications);
    } catch (error) {
      return next(error);
    }
  };

  public markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant';
      const userId = authReq.user?.userId;
      const { id } = req.params;

      if (!userId) return this.badRequest(res, 'User ID is required');

      await prisma.notification.updateMany({
        where: { id, tenantId, userId },
        data: { isRead: true },
      });

      return this.rawOk(res, { success: true });
    } catch (error) {
      return next(error);
    }
  };

  public markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant';
      const userId = authReq.user?.userId;

      if (!userId) return this.badRequest(res, 'User ID is required');

      await prisma.notification.updateMany({
        where: { tenantId, userId, isRead: false },
        data: { isRead: true },
      });

      return this.rawOk(res, { success: true });
    } catch (error) {
      return next(error);
    }
  };
}
