import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { logger } from '../../infrastructure/logging/logger';
import { AIServiceError } from '../../shared/errors/AIServiceError';
import { AppError } from '../../shared/errors/app-error';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { ValidationError } from '../../shared/errors/ValidationError';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error({ err: error }, 'Unhandled API error');

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Request validation failed.',
        code: 'VALIDATION_ERROR',
        details: error.flatten(),
      },
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message,
        code: 'FILE_UPLOAD_ERROR',
      },
    });
    return;
  }

  if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AIServiceError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      message: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
};
