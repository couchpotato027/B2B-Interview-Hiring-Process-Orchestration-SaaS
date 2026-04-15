import { Request, Response, NextFunction } from 'express';
import { logger } from '../../infrastructure/logging/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { method, url } = req;

  // Log immediate arrival
  logger.info({ method, url }, `Incoming Request: ${method} ${url}`);

  // Log on request completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const logPayload = {
      method,
      url: req.originalUrl || url,
      statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (statusCode >= 500) {
      logger.error(logPayload, `Request Failed: ${method} ${url} [${statusCode}]`);
    } else if (statusCode >= 400) {
      logger.warn(logPayload, `Request Finished with Client Error: ${method} ${url} [${statusCode}]`);
    } else {
      logger.info(logPayload, `Request Completed: ${method} ${url} [${statusCode}]`);
    }
  });

  next();
};
