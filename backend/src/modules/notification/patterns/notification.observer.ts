import { SlaAlert } from '@prisma/client';
import { logger } from '../../../infrastructure/logging/logger';

export interface NotificationEvent {
    type: string;
    tenantId: string;
    payload: any;
}

export interface IObserver {
    update(event: NotificationEvent): Promise<void>;
}

export interface ISubject {
    attach(observer: IObserver): void;
    notify(event: NotificationEvent): void;
}

export class NotificationEventBus implements ISubject {
    private observers: { [key: string]: IObserver[] } = {};
    private static instance: NotificationEventBus;

    private constructor() { }

    public static getInstance(): NotificationEventBus {
        if (!NotificationEventBus.instance) {
            NotificationEventBus.instance = new NotificationEventBus();
        }
        return NotificationEventBus.instance;
    }

    public attach(observer: IObserver, eventType: string = 'SLA_VIOLATION'): void {
        if (!this.observers[eventType]) {
            this.observers[eventType] = [];
        }
        this.observers[eventType].push(observer);
    }

    public notify(event: NotificationEvent): void {
        const subscribers = this.observers[event.type] || [];
        subscribers.forEach((obs) => {
            obs.update(event).catch((err) => logger.error('Observer Error:', err));
        });
    }
}

// Concrete Observer
export class SlackAlertObserver implements IObserver {
    async update(event: NotificationEvent): Promise<void> {
        if (event.type === 'SLA_VIOLATION') {
            const data = event.payload as SlaAlert;
            // In a real application, we would call the Slack API here
            logger.info(`[SLACK ALERT] SLA Violation for Candidate ${data.candidateId}: ${data.alertMessage}`);
        }
    }
}

// Concrete Observer
export class EmailAlertObserver implements IObserver {
    async update(event: NotificationEvent): Promise<void> {
        if (event.type === 'SLA_VIOLATION') {
            const data = event.payload;
            // In a real application, we would send an email via SendGrid/AWS SES
            logger.info(`[EMAIL ALERT] SLA Violation for Candidate ${data.candidateId}`);
        }
    }
}
