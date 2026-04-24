import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../../infrastructure/middleware/AuthMiddleware';

const notificationRouter = Router();
const ctrl = new NotificationController();

notificationRouter.use(authMiddleware);

notificationRouter.get('/', ctrl.getNotifications);
notificationRouter.put('/read-all', ctrl.markAllAsRead);
notificationRouter.put('/:id/read', ctrl.markAsRead);

export { notificationRouter };
