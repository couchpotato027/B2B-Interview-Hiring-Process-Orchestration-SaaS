import { Router } from 'express';
import { registerTenant, login, getMe, listUsers, createUser } from './auth.controller';
import { tenantContextMiddleware } from '../../shared/middlewares/tenantContext.middleware';
import { requirePermission } from '../../shared/middlewares/rbac.middleware';

const router = Router();

// Public routes
router.post('/register', registerTenant);
router.post('/login', login);

// Protected routes
router.get('/me', tenantContextMiddleware, getMe);
router.get('/users', tenantContextMiddleware, requirePermission('User', 'READ'), listUsers);
router.post('/users', tenantContextMiddleware, requirePermission('User', 'CREATE'), createUser);

export default router;
