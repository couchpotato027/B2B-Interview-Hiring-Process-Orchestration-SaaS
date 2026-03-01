import { Router } from 'express';
import { registerTenant, login } from './auth.controller';

const router = Router();

router.post('/register', registerTenant);
router.post('/login', login);

export default router;
