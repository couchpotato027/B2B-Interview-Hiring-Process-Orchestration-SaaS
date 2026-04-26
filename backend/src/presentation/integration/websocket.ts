import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../../infrastructure/logging/logger';
import { corsConfig } from './corsConfig';

export class WebSocketService {
  private static instance: WebSocketService;
  private io: Server | null = null;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public initialize(server: HttpServer): void {
    this.io = new Server(server, {
      cors: corsConfig,
      pingTimeout: 60000,
      transports: ['polling', 'websocket'],
    });

    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error'));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-for-dev');
        (socket as any).user = decoded;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info({ socketId: socket.id }, 'New WebSocket connection');

      socket.on('disconnect', () => {
        logger.info({ socketId: socket.id }, 'WebSocket disconnected');
      });

      // Auto-join based on decoded user tenant
      const user = (socket as any).user;
      if (user && user.organizationId) {
        socket.join(`organization:${user.organizationId}`);
        logger.info({ socketId: socket.id, tenantId: user.organizationId }, 'Socket auto-joined tenant room');
      }

      // Allow manual join if necessary (and validated)
      socket.on('join_tenant', (tenantId: string) => {
        if (user && user.organizationId === tenantId) {
          socket.join(`organization:${tenantId}`);
          logger.info({ socketId: socket.id, tenantId }, 'Socket explicitly joined tenant room');
        }
      });
    });

    logger.info('WebSocket server initialized');
  }

  public emit(tenantId: string, event: string, payload: any): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized, cannot emit event');
      return;
    }

    // Emit to everyone in the tenant room (prefixed)
    this.io.to(`organization:${tenantId}`).emit(event, payload);
    logger.debug({ event, tenantId }, 'WebSocket event emitted');
  }
}

export const wsService = WebSocketService.getInstance();
