/**
 * Unified HireFlow Server
 *
 * Architecture Decision: Single server that mounts BOTH layers in correct order.
 *
 * Layer 1 — Module routes  (/api/v1/*)
 *   Full Prisma-backed, JWT-protected, multi-tenant routes.
 *   These are what the frontend calls and what all real data flows through.
 *
 * Layer 2 — Clean-Architecture routes  (/api/*)
 *   DI-container-backed, in-memory repos used for AI evaluation pipeline.
 *   These endpoints complement the module routes.
 *
 * Middleware Order (matters for Express):
 *   1. Security (disable x-powered-by)
 *   2. CORS  — must be before any route handler
 *   3. Request logger
 *   4. Body parsers
 *   5. Public routes (no auth required)
 *   6. Protected module routes  /api/v1/*
 *   7. Clean-arch routes        /api/*
 *   8. 404 handler
 *   9. Unified error handler (last - catches everything above)
 */

import cors from 'cors';
import express from 'express';
import { env }                 from '../infrastructure/config/env';
import { logger }              from '../infrastructure/logging/logger';
import { errorHandler }        from './middleware/error-handler';
import { notFoundHandler }     from './middleware/not-found.middleware';
import { apiRouter }           from './routes';
import moduleRoutes            from '../routes';
import { corsConfig }          from './integration/corsConfig';
import { requestLogger }       from './middleware/request-logger.middleware';

export const createServer = () => {
  const app = express();

  // ── Security ──────────────────────────────────────────────────────────────
  app.disable('x-powered-by');

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.use(cors(corsConfig));

  // ── Request logger ────────────────────────────────────────────────────────
  app.use(requestLogger);

  // ── Body parsers ──────────────────────────────────────────────────────────
  // multipart/form-data is handled per-route by multer; only JSON here.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Module routes  (/api/v1/*) ────────────────────────────────────────────
  // Prisma + JWT + multi-tenant.  Auth middleware is applied per-router inside
  // each module, so public routes (register, login) work without a token.
  app.use(moduleRoutes);

  // ── Clean-Architecture routes  (/api/*) ───────────────────────────────────
  // DI-container + in-memory repos + Claude AI evaluation pipeline.
  app.use('/api', apiRouter);

  // ── 404 fallback ──────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Unified error handler ─────────────────────────────────────────────────
  // Must be last.  Catches every error thrown or passed to next() above.
  // Handles: AppError, ZodError, MulterError, Prisma P20xx codes, plain objects.
  app.use(errorHandler);

  return app;
};
