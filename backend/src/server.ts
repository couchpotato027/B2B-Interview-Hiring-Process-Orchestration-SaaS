/**
 * @deprecated — DO NOT USE
 *
 * This file was the original standalone module-based server.
 * It has been superseded by the unified server architecture.
 *
 * The application now starts from:
 *   src/index.ts  →  src/presentation/server.ts
 *
 * That single server mounts:
 *   • Module routes  (/api/v1/*)  from src/routes.ts
 *   • Clean-arch API (/api/*)     from src/presentation/routes/index.ts
 *
 * This file is intentionally left as a marker.
 * It is safe to delete once the migration is confirmed stable.
 */

export {};
