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

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // 1. Try to extract token from header (works for both dev and prod)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const container = Container.getInstance();
        const authService = container.resolve<AuthService>('AuthService');
        const payload = authService.verifyToken(token);
        req.user = payload;
        return next();
      } catch (error) {
        // Token invalid — fall through to dev bypass or reject
      }
    }
  }

  // 2. Development Bypass (only if no valid token was provided)
  if (process.env.SKIP_AUTH === 'true' || process.env.REQUIRE_AUTH === 'false') {
    // Use a real user from DB via lazy lookup (cached after first call)
    resolveDevUser().then(devUser => {
      req.user = devUser;
      next();
    }).catch(() => {
      // Fallback if DB lookup fails
      req.user = {
        userId: 'system',
        organizationId: 'default-tenant',
        role: 'ADMIN',
        email: 'admin@hireflow.com'
      };
      next();
    });
    return;
  }

  // 3. No token, no bypass — reject
  res.status(401).json({
    success: false,
    error: 'Authorization header is missing or invalid',
    code: 'UNAUTHORIZED'
  });
};

// Cache the dev user so we don't hit the DB on every request
let cachedDevUser: AuthenticatedRequest['user'] | null = null;

async function resolveDevUser(): Promise<NonNullable<AuthenticatedRequest['user']>> {
  if (cachedDevUser) return cachedDevUser;

  try {
    const { prisma } = require('../database/prisma.client');
    // Find the admin user in the default tenant
    const user = await prisma.user.findFirst({
      where: { email: 'admin@hireflow.com' },
      include: { role: true },
      orderBy: { createdAt: 'desc' }, // Newest first
    });

    if (user) {
      cachedDevUser = {
        userId: user.id,
        email: user.email,
        role: user.role?.name || 'ADMIN',
        organizationId: user.tenantId,
      };
      return cachedDevUser;
    }
  } catch (err) {
    console.warn('[AuthMiddleware] Failed to resolve dev user from DB:', err);
  }

  // Absolute fallback
  cachedDevUser = {
    userId: 'system',
    organizationId: 'default-tenant',
    role: 'ADMIN',
    email: 'admin@hireflow.com'
  };
  return cachedDevUser;
}
