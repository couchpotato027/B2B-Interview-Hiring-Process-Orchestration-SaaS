import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { Container } from '../di/Container';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    organizationId: string;
  };
}

const PUBLIC_ROUTES = [
  'GET /api/v1/candidates',
  'GET /api/v1/jobs',
  'GET /api/v1/pipelines',
  'GET /api/v1/evaluations',
  'GET /api/health',
  'GET /api/v1/dashboard/stats',
  'GET /api/reports/funnel'
];

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // 1. Development Bypass
  if (process.env.SKIP_AUTH === 'true' || process.env.REQUIRE_AUTH === 'false') {
    req.user = { 
        userId: 'admin-id', 
        organizationId: 'default-tenant-id', 
        role: 'ADMIN', 
        email: 'admin@hireflow.com' 
    };
    return next();
  }

  // 2. Check for Public Routes (GET only)
  const routeKey = `${req.method} ${req.path}`;
  const isPublic = PUBLIC_ROUTES.some(route => 
    routeKey.startsWith(route) || (req.method === 'GET' && req.path.includes('/api/v1/evaluations'))
  );

  if (isPublic) {
    // Set default context so queries work
    req.user = { 
        userId: 'admin-id', 
        organizationId: 'default-tenant-id', 
        role: 'ADMIN', 
        email: 'admin@hireflow.com' 
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authorization header is missing or invalid',
      code: 'UNAUTHORIZED'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Token is missing',
      code: 'UNAUTHORIZED'
    });
    return;
  }

  const container = Container.getInstance();
  const authService = container.resolve<AuthService>('AuthService');

  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'UNAUTHORIZED'
    });
    return;
  }
};
