import { Request, Response, NextFunction } from 'express';
import { logger } from '../../infrastructure/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err);

    // Handle Prisma-specific errors
    if (err.code === 'P2002') {
        return res.status(409).json({
            error: {
                message: `A record with that value already exists. Duplicate field: ${err.meta?.target?.join(', ') || 'unknown'}`,
            },
        });
    }

    if (err.code === 'P2003') {
        return res.status(400).json({
            error: {
                message: `Related record not found. Check that related entities exist. Field: ${err.meta?.field_name || 'unknown'}`,
            },
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            error: {
                message: err.meta?.cause || 'Record not found.',
            },
        });
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
};
