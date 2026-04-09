/**
 * Unified Error Handler
 *
 * Handles errors from BOTH server layers:
 *   - Module layer  → Prisma P20xx codes, typed domain errors
 *   - Clean-arch layer → AppError, ZodError, MulterError, typed domain errors
 */

import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { logger } from '../../infrastructure/logging/logger';
import { AppError } from '../../shared/errors/app-error';

// ─── helpers ─────────────────────────────────────────────────────────────────

const jsonResponse = (res: Response, status: number, message: string, code: string, extra?: object) =>
  res.status(status).json({
    success: false,
    error: { message, code, ...extra },
  });

// ─── handler ─────────────────────────────────────────────────────────────────

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error({ err: error }, 'Unhandled API error');

  // ── Typed AppErrors (Domain Errors) ────────────────────────────────────────
  if (error instanceof AppError) {
    res.status(error.statusCode).json(error.toJSON());
    return;
  }

  // ── Zod validation error ──────────────────────────────────────────────────
  if (error instanceof ZodError) {
    jsonResponse(res, 400, 'Request validation failed.', 'VALIDATION_ERROR', {
      details: error.flatten(),
    });
    return;
  }

  // ── Multer file-upload error ───────────────────────────────────────────────
  if (error instanceof multer.MulterError) {
    jsonResponse(res, 400, error.message, 'FILE_UPLOAD_ERROR');
    return;
  }

  // ── Prisma known error codes ───────────────────────────────────────────────
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaError = error as { code: string; meta?: Record<string, unknown>; message?: string };

    if (prismaError.code === 'P2002') {
      const target = Array.isArray(prismaError.meta?.target)
        ? (prismaError.meta!.target as string[]).join(', ')
        : 'unknown';
      jsonResponse(res, 409, `A record with that value already exists. Duplicate field: ${target}`, 'DUPLICATE_RECORD');
      return;
    }
    if (prismaError.code === 'P2003') {
      const field = (prismaError.meta?.field_name as string | undefined) ?? 'unknown';
      jsonResponse(res, 400, `Related record not found. Field: ${field}`, 'FOREIGN_KEY_CONSTRAINT');
      return;
    }
    if (prismaError.code === 'P2025') {
      const cause = (prismaError.meta?.cause as string | undefined) ?? 'Record not found.';
      jsonResponse(res, 404, cause, 'RECORD_NOT_FOUND');
      return;
    }
  }

  // ── Support for legacy plain { statusCode, message } objects ──────────────
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const plain = error as { statusCode: number; message?: string; code?: string };
    jsonResponse(
      res,
      plain.statusCode,
      plain.message ?? 'An error occurred.',
      plain.code ?? 'REQUEST_ERROR',
    );
    return;
  }

  // ── Fallback ───────────────────────────────────────────────────────────────
  const message = error instanceof Error ? error.message : 'Internal server error';
  jsonResponse(res, 500, message, 'INTERNAL_SERVER_ERROR');
};
