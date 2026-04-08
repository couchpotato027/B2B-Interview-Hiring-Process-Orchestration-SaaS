import type { Response } from 'express';

export abstract class BaseController {
  protected ok<T>(res: Response, data: T): Response {
    return res.status(200).json({
      success: true,
      data,
    });
  }

  protected created<T>(res: Response, data: T): Response {
    return res.status(201).json({
      success: true,
      data,
    });
  }

  protected badRequest(res: Response, message: string, code = 'BAD_REQUEST'): Response {
    return res.status(400).json({
      success: false,
      error: {
        message,
        code,
      },
    });
  }

  protected notFound(res: Response, message: string, code = 'NOT_FOUND'): Response {
    return res.status(404).json({
      success: false,
      error: {
        message,
        code,
      },
    });
  }

  protected serverError(
    res: Response,
    error: { message?: string; code?: string } | unknown,
  ): Response {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : 'Internal server error';
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : 'INTERNAL_SERVER_ERROR';

    return res.status(500).json({
      success: false,
      error: {
        message,
        code,
      },
    });
  }
}
