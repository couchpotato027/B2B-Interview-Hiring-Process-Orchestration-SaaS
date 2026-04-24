import { ICalendarService, CalendarEvent } from '../../domain/services/ICalendarService';

export class MockCalendarService implements ICalendarService {
  async createEvent(event: CalendarEvent): Promise<string> {
    console.log(`📡 [MockCalendar] Creating event: ${event.title} at ${event.startTime}`);
    return `mock-event-${Date.now()}`;
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<void> {
    console.log(`📡 [MockCalendar] Updating event ${eventId}`);
  }

  async deleteEvent(eventId: string): Promise<void> {
    console.log(`📡 [MockCalendar] Deleting event ${eventId}`);
  }

  async checkAvailability(emails: string[], start: Date, end: Date): Promise<boolean> {
    console.log(`📡 [MockCalendar] Checking availability for ${emails.join(', ')}`);
    return true; // Always available in mock
  }
}
