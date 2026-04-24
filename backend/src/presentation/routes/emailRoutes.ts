import { Router } from 'express';
import { EmailController } from '../controllers/EmailController';
import { authMiddleware } from '../../infrastructure/middleware/AuthMiddleware';

const emailRouter = Router();
const ctrl = new EmailController();

emailRouter.use(authMiddleware);

emailRouter.get('/templates', ctrl.getTemplates);
emailRouter.post('/send', ctrl.sendEmail);
emailRouter.post('/bulk', ctrl.bulkSend);
emailRouter.get('/history/:candidateId', ctrl.getHistory);

export { emailRouter };
