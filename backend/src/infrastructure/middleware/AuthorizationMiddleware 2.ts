import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './AuthMiddleware';
import { Role } from '../../domain/types/Role';

export const authorizationMiddleware = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};
