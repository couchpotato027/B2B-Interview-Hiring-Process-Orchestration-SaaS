import type { NextFunction, Request, Response } from 'express';
import { logger } from '../../infrastructure/logging/logger';
import { AppError } from '../../shared/errors/app-error';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const normalizedError =
    error instanceof AppError
      ? error
      : new AppError('Internal server error', 500, {
          cause: error,
        });

  logger.error(
    {
      err: normalizedError,
      details: normalizedError.details,
    },
    normalizedError.message,
  );

  res.status(normalizedError.statusCode).json({
    error: {
      message: normalizedError.message,
      details: normalizedError.details ?? null,
    },
  });
};
