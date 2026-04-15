// Deployment Version: 2.0.0
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { apiRouter } from './presentation/routes';
import moduleRoutes from './routes';
import { logger } from './infrastructure/logging/logger';

// Load environment variables
dotenv.config();

const app = express();

// ═══════════════════════════════════════════════════════
// BULLETPROOF CORS — runs BEFORE everything else
// ═══════════════════════════════════════════════════════
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

  // Immediately respond to preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`📡 ${req.method} ${req.url}`);
  next();
});

// 2. PUBLIC ROUTES
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date(), 
    service: 'HireFlow Unified Server' 
  });
});

// 3. MOUNT ARCHITECTURES
// Mount Clean Architecture routes under /api/v1
app.use('/api/v1', apiRouter);

// Mount Legacy Module routes (which already have /api/v1 prefixes)
app.use(moduleRoutes);

// Debug Route: List all registered routes
app.get('/api/debug/routes', (req: Request, res: Response) => {
  const routes: any[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          routes.push(`${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${handler.route.path}`);
        }
      });
    }
  });
  res.json({ count: routes.length, routes });
});

// 4. 404 HANDLER
app.use((req: Request, res: Response) => {
  logger.warn(`🔍 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.path}`,
      code: 'NOT_FOUND'
    }
  });
});

// 5. GLOBAL ERROR HANDLER
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err, `❌ UNHANDLED ERROR: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_SERVER_ERROR',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});

export default app;
