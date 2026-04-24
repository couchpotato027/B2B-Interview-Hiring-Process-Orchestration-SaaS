import { Router } from 'express';
import { handleWebhook } from '../controllers/WebhookController';
import { apiKeyMiddleware } from '../../infrastructure/middleware/ApiKeyMiddleware';

const publicApiRouter = Router();
const webhookRouter = Router();

// Public API Routes (API Key Auth)
publicApiRouter.use(apiKeyMiddleware);
publicApiRouter.get('/candidates', (req, res) => res.json({ message: 'Public discovery active' }));

// Webhook Routes (Provider Secret Validation)
webhookRouter.post('/:provider', handleWebhook);

export { publicApiRouter, webhookRouter };
