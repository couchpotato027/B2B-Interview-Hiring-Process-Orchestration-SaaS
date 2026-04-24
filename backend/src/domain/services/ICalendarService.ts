export interface CalendarEvent {
  id?: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendees: Array<{ email: string; name?: string }>;
  location?: string;
  meetingLink?: string;
}

export interface ICalendarService {
  createEvent(event: CalendarEvent): Promise<string>; // returns event ID
  updateEvent(eventId: string, event: CalendarEvent): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
  checkAvailability(emails: string[], start: Date, end: Date): Promise<boolean>;
}
