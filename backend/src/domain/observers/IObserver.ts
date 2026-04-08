import type { DomainEvent } from '../events/DomainEvents';

export interface IObserver<T extends DomainEvent> {
  handle(event: T): Promise<void>;
  getEventType(): string;
}
