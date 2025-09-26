export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
    }>;
  };
  creator?: {
    email: string;
    displayName?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  status?: string;
  htmlLink?: string;
}

export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  accessRole?: string;
  primary?: boolean;
}

export interface CreateEventData {
  title: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  attendees?: string[];
  additionalProperties?: Record<string, any>;
}

export interface EventSearchOptions {
  timeMin?: string;
  timeMax?: string;
  maxResults?: string;
  params?: Record<string, string>;
}

export interface FreeBusyRequest {
  timeMin: string;
  timeMax: string;
  timeZone?: string;
  items: Array<{ id: string }>;
}

export interface AuthContextType {
  user: GoogleUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccessToken: () => Promise<string>;
}

export interface CalendarContextType {
  calendars: Calendar[];
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  fetchCalendars: () => Promise<Calendar[]>;
  fetchEvents: (calendarId?: string, options?: EventSearchOptions) => Promise<CalendarEvent[]>;
  createEvent: (calendarId: string, eventData: CreateEventData) => Promise<CalendarEvent>;
  createEventWithMeet: (calendarId: string, eventData: CreateEventData) => Promise<CalendarEvent>;
  updateEvent: (calendarId: string, eventId: string, eventData: Partial<CreateEventData>) => Promise<CalendarEvent>;
  deleteEvent: (calendarId: string, eventId: string) => Promise<boolean>;
  searchEvents: (query: string, calendarId?: string, options?: EventSearchOptions) => Promise<CalendarEvent[]>;
}
