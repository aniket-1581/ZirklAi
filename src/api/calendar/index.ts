import { GOOGLE_CONFIG } from '@/constants/googleConfig';
import { 
  CalendarEvent, 
  Calendar, 
  CreateEventData, 
  EventSearchOptions, 
  FreeBusyRequest 
} from '@/types/calendar';

interface ApiResponse<T = any> {
  items?: T[];
  [key: string]: any;
}

class GoogleCalendarApi {
  private accessToken: string;
  private baseURL: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.baseURL = GOOGLE_CONFIG.CALENDAR_API_BASE;
  }

  private async makeRequest<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers as HeadersInit),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Calendar API Error: ${errorData.error?.message || response.statusText}`);
      }

      if (options.method === 'DELETE') {
        return { success: true } as T;
      }

      return await response.json();
    } catch (error) {
      console.error('Google Calendar API Request Error:', error);
      throw error;
    }
  }

  // Get list of calendars
  async getCalendars(): Promise<ApiResponse<Calendar>> {
    return await this.makeRequest<ApiResponse<Calendar>>('/users/me/calendarList');
  }

  // Get events from a specific calendar
  async getEvents(
    calendarId: string = 'primary', 
    options: EventSearchOptions = {}
  ): Promise<ApiResponse<CalendarEvent>> {
    const params = new URLSearchParams({
      timeMin: options.timeMin || new Date().toISOString(),
      timeMax: options.timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: options.maxResults || '50',
      ...options.params,
    });

    return await this.makeRequest<ApiResponse<CalendarEvent>>(
      `/calendars/${encodeURIComponent(calendarId)}/events?${params}`
    );
  }

  // Create a new event
  async createEvent(
    calendarId: string = 'primary', 
    eventData: CreateEventData
  ): Promise<CalendarEvent> {
    const event = {
      summary: eventData.title || 'New Event',
      description: eventData.description || '',
      start: {
        dateTime: eventData.startDateTime,
        timeZone: eventData.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: eventData.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      location: eventData.location || '',
      attendees: eventData.attendees?.map(email => ({ email })) || [],
      reminders: {
        useDefault: true,
      },
      ...eventData.additionalProperties,
    };

    return await this.makeRequest<CalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        body: JSON.stringify(event),
      }
    );
  }

  // Update an existing event
  async updateEvent(
    calendarId: string = 'primary', 
    eventId: string, 
    eventData: Partial<CreateEventData>
  ): Promise<CalendarEvent> {
    return await this.makeRequest<CalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'PUT',
        body: JSON.stringify(eventData),
      }
    );
  }

  // Delete an event
  async deleteEvent(
    calendarId: string = 'primary', 
    eventId: string
  ): Promise<{ success: boolean }> {
    return await this.makeRequest<{ success: boolean }>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Get a specific event
  async getEvent(
    calendarId: string = 'primary', 
    eventId: string
  ): Promise<CalendarEvent> {
    return await this.makeRequest<CalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`
    );
  }

  // Create event with Google Meet
  async createEventWithMeet(
    calendarId: string = 'primary', 
    eventData: CreateEventData
  ): Promise<CalendarEvent> {
    const event = {
      summary: eventData.title || 'New Event',
      description: eventData.description || '',
      start: {
        dateTime: eventData.startDateTime,
        timeZone: eventData.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: eventData.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      location: eventData.location || '',
      attendees: eventData.attendees?.map(email => ({ email })) || [],
      conferenceData: {
        createRequest: {
          requestId: `meet_${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      reminders: {
        useDefault: true,
      },
    };

    return await this.makeRequest<CalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        body: JSON.stringify(event),
      }
    );
  }

  // Search events
  async searchEvents(
    query: string, 
    calendarId: string = 'primary', 
    options: EventSearchOptions = {}
  ): Promise<ApiResponse<CalendarEvent>> {
    const params = new URLSearchParams({
      q: query,
      timeMin: options.timeMin || new Date().toISOString(),
      timeMax: options.timeMax || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: options.maxResults || '50',
    });

    return await this.makeRequest<ApiResponse<CalendarEvent>>(
      `/calendars/${encodeURIComponent(calendarId)}/events?${params}`
    );
  }

  // Get busy times for scheduling
  async getFreeBusy(request: FreeBusyRequest): Promise<any> {
    const requestBody = {
      timeMin: request.timeMin,
      timeMax: request.timeMax,
      timeZone: request.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      items: request.items
    };

    return await this.makeRequest('/freeBusy', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }
}

export default GoogleCalendarApi;
