import { Request, Response, NextFunction } from 'express';
import { logger } from '../../infrastructure/logging/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log on request completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const logPayload = {
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (statusCode >= 500) {
      logger.error(logPayload, 'Request failed (Server Error)');
    } else if (statusCode >= 400) {
      logger.warn(logPayload, 'Request failed (Client Error)');
    } else {
      logger.info(logPayload, 'Request completed');
    }
  });

  next();
};
