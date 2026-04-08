import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  healthController.getHealth(req, res);
});

export { healthRouter };
