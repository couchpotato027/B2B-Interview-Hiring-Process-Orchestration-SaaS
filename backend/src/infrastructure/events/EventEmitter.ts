import type { DomainEvent } from '../../domain/events/DomainEvents';
import { logger } from '../logging/logger';

export type EventHandler = (event: DomainEvent) => Promise<void>;

export class EventEmitter {
  private static instance: EventEmitter | null = null;

  private readonly handlers = new Map<string, EventHandler[]>();

  private constructor() {}

  public static getInstance(): EventEmitter {
    if (!EventEmitter.instance) {
      EventEmitter.instance = new EventEmitter();
    }

    return EventEmitter.instance;
  }

  public subscribe(eventType: string, handler: EventHandler): void {
    const existingHandlers = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existingHandlers, handler]);
  }

  public unsubscribe(eventType: string, handler: EventHandler): void {
    const existingHandlers = this.handlers.get(eventType) ?? [];
    this.handlers.set(
      eventType,
      existingHandlers.filter((registeredHandler) => registeredHandler !== handler),
    );
  }

  public async emit(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? [];

    logger.info(
      {
        eventType: event.eventType,
        handlers: handlers.length,
      },
      'Emitting domain event',
    );

    await Promise.allSettled(
      handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          logger.error(
            {
              err: error,
              eventType: event.eventType,
            },
            'Domain event handler failed',
          );
        }
      }),
    );
  }
}
