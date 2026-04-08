import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export const validateRequestBody =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Request validation failed.',
          code: 'VALIDATION_ERROR',
          details: result.error.flatten(),
        },
      });
      return;
    }

    req.body = result.data;
    next();
  };
