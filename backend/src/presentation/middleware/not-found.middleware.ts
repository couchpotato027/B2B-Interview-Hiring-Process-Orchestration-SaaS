import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/errors/app-error';

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError('Route not found', 404));
};
