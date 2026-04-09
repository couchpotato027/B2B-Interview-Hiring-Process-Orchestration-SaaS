import type { DomainEvent } from '../../domain/events/DomainEvents';
import type { IObserver } from '../../domain/observers/IObserver';
import type { IResumeRepository } from '../../domain/repositories/IResumeRepository';
import { EventEmitter, type EventHandler } from '../events/EventEmitter';
import { DashboardMetricsObserver } from './DashboardMetricsObserver';
import { EmailNotificationObserver } from './EmailNotificationObserver';
import { SLAMonitorObserver } from './SLAMonitorObserver';
import { StageTransitionObserver } from './StageTransitionObserver';
import { AutoEmailObserver } from './AutoEmailObserver';
import { SLATrackingObserver } from './SLATrackingObserver';
import { AnalyticsCacheObserver } from './AnalyticsCacheObserver';

export class ObserverRegistry {
  private readonly eventEmitter: EventEmitter;

  constructor(
    private readonly resumeRepository: IResumeRepository,
    eventEmitter?: EventEmitter,
  ) {
    this.eventEmitter = eventEmitter ?? EventEmitter.getInstance();
  }

  public registerAll(): void {
    const emailNotificationObserver = new EmailNotificationObserver();
    const dashboardMetricsObserver = new DashboardMetricsObserver();
    const slaMonitorObserver = new SLAMonitorObserver(this.resumeRepository);
    const stageTransitionObserver = new StageTransitionObserver();
    const autoEmailObserver = new AutoEmailObserver();
    const slaTrackingObserver = new SLATrackingObserver();
    const analyticsCacheObserver = new AnalyticsCacheObserver();

    this.registerObserver(emailNotificationObserver);
    this.registerObserver(slaMonitorObserver);
    this.registerObserver(stageTransitionObserver);
    this.registerObserver(autoEmailObserver);
    this.registerObserver(slaTrackingObserver);

    for (const eventType of analyticsCacheObserver.getSupportedEventTypes()) {
        this.registerObserverForEventType(analyticsCacheObserver, eventType);
    }

    for (const eventType of dashboardMetricsObserver.getSupportedEventTypes()) {
      this.registerObserverForEventType(dashboardMetricsObserver, eventType);
    }
  }

  private registerObserver<T extends DomainEvent>(observer: IObserver<T>): void {
    this.registerObserverForEventType(observer, observer.getEventType());
  }

  private registerObserverForEventType<T extends DomainEvent>(
    observer: IObserver<T>,
    eventType: string,
  ): void {
    const handler: EventHandler = async (event) => {
      await observer.handle(event as T);
    };

    this.eventEmitter.subscribe(eventType, handler);
  }
}
