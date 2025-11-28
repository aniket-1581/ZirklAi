const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/v1` || 'https://netmate.mettasocial.com/api/v1';

// TypeScript interfaces matching the backend models

export interface CalendarEventItem {
  title: string;
  startDate: string;
  endDate: string;
  timeZone: string;
  location?: string;
  notes?: string;
  contact_name?: string;
}

export interface CalendarEventCreate {
  calendar_events: CalendarEventItem[];
}

export interface CalendarEventResponse {
  title: string;
  startDate: string;
  endDate: string;
  timeZone: string;
  location?: string;
  notes?: string;
  contact_name?: string;
}

export interface CalendarEventListResponse {
  calendar_events: CalendarEventResponse[];
  total_count: number;
}

export interface CalendarEventSyncRequest {
  device_events: CalendarEventItem[];
}

export interface CalendarEventSyncResponse {
  synced_count: number;
  duplicates_skipped: number;
  errors: string[];
  synced_events: CalendarEventResponse[];
}

// API functions

export async function createCalendarEvents(
  events: CalendarEventCreate,
  token: string
): Promise<CalendarEventResponse[]> {
  const res = await fetch(`${BASE_URL}/calendar-events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(events),
  });
  if (!res.ok) throw new Error('Failed to create calendar events');
  return res.json();
}

export async function getCalendarEvents(
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<CalendarEventListResponse> {
  const res = await fetch(`${BASE_URL}/calendar-events?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch calendar events');
  return res.json();
}

export async function getCalendarEventById(
  eventId: string,
  token: string
): Promise<CalendarEventResponse> {
  const res = await fetch(`${BASE_URL}/calendar-events/${eventId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch calendar event');
  return res.json();
}

export async function deleteCalendarEvent(
  eventId: string,
  token: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/calendar-events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to delete calendar event');
}

export async function deleteAllCalendarEvents(token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/calendar-events`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to delete all calendar events');
}

export async function syncCalendarEvents(
  syncRequest: CalendarEventSyncRequest,
  token: string
): Promise<CalendarEventSyncResponse> {
  const res = await fetch(`${BASE_URL}/calendar-events/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(syncRequest),
  });
  if (!res.ok) throw new Error('Failed to sync calendar events');
  return res.json();
}

export async function getCalendarEventIds(token: string): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/calendar-events-ids`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch calendar event ids');
  return res.json();
}