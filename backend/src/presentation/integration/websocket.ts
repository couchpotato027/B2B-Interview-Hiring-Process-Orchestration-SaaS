import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
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
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info({ socketId: socket.id }, 'New WebSocket connection');

      socket.on('disconnect', () => {
        logger.info({ socketId: socket.id }, 'WebSocket disconnected');
      });

      // Join tenant-specific rooms for scoped updates
      socket.on('join_tenant', (tenantId: string) => {
        socket.join(tenantId);
        logger.info({ socketId: socket.id, tenantId }, 'Socket joined tenant room');
      });
    });

    logger.info('WebSocket server initialized');
  }

  public emit(tenantId: string, event: string, payload: any): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized, cannot emit event');
      return;
    }

    // Emit to everyone in the tenant room
    this.io.to(tenantId).emit(event, payload);
    logger.debug({ event, tenantId }, 'WebSocket event emitted');
  }
}

export const wsService = WebSocketService.getInstance();
