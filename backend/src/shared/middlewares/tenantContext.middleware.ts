import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../../infrastructure/logger';

export interface AppRequest extends Request {
    user?: {
        id: string;
        tenantId: string;
        role: string;
        email: string;
    };
}

export const tenantContextMiddleware = (req: AppRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized access. Token missing or invalid.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET || 'secret';
        const decoded = jwt.verify(token, secret) as any;

        req.user = {
            id: decoded.id,
            tenantId: decoded.tenantId,
            role: decoded.role,
            email: decoded.email,
        };

        next();
    } catch (error) {
        logger.error({ err: error }, 'JWT Verification failed');
        return res.status(403).json({ error: 'Token expired or invalid.' });
    }
};
