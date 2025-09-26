import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import useGoogleAuth from '../hooks/useGoogleAuth';
import GoogleCalendarApi from '@/api/calendar';
import { 
  Calendar, 
  CalendarEvent, 
  CreateEventData, 
  EventSearchOptions,
  CalendarContextType 
} from '@/types/calendar';

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

interface CalendarProviderProps {
  children: ReactNode;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  const { accessToken, isAuthenticated, refreshAccessToken } = useGoogleAuth();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getCalendarApi = async (): Promise<GoogleCalendarApi> => {
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      return new GoogleCalendarApi(accessToken);
    } catch (error) {
      // Try to refresh token if API creation fails
      const newToken = await refreshAccessToken();
      return new GoogleCalendarApi(newToken);
    }
  };

  const fetchCalendars = async (): Promise<Calendar[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const api = await getCalendarApi();
      const response = await api.getCalendars();
      const calendarList = response.items || [];
      setCalendars(calendarList);
      
      return calendarList;
    } catch (error: any) {
      console.error('Error fetching calendars:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async (
    calendarId: string = 'primary', 
    options: EventSearchOptions = {}
  ): Promise<CalendarEvent[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const api = await getCalendarApi();
      const response = await api.getEvents(calendarId, options);
      const eventList = response.items || [];
      setEvents(eventList);
      
      return eventList;
    } catch (error: any) {
      console.error('Error fetching events:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (
    calendarId: string = 'primary', 
    eventData: CreateEventData
  ): Promise<CalendarEvent> => {
    try {
      setError(null);
      const api = await getCalendarApi();
      const event = await api.createEvent(calendarId, eventData);
      
      // Refresh events after creating
      await fetchEvents(calendarId);
      
      return event;
    } catch (error: any) {
      console.error('Error creating event:', error);
      setError(error.message);
      throw error;
    }
  };

  const createEventWithMeet = async (
    calendarId: string = 'primary', 
    eventData: CreateEventData
  ): Promise<CalendarEvent> => {
    try {
      setError(null);
      const api = await getCalendarApi();
      const event = await api.createEventWithMeet(calendarId, eventData);
      
      // Refresh events after creating
      await fetchEvents(calendarId);
      
      return event;
    } catch (error: any) {
      console.error('Error creating event with Meet:', error);
      setError(error.message);
      throw error;
    }
  };

  const updateEvent = async (
    calendarId: string = 'primary', 
    eventId: string, 
    eventData: Partial<CreateEventData>
  ): Promise<CalendarEvent> => {
    try {
      setError(null);
      const api = await getCalendarApi();
      const event = await api.updateEvent(calendarId, eventId, eventData);
      
      // Refresh events after updating
      await fetchEvents(calendarId);
      
      return event;
    } catch (error: any) {
      console.error('Error updating event:', error);
      setError(error.message);
      throw error;
    }
  };

  const deleteEvent = async (
    calendarId: string = 'primary', 
    eventId: string
  ): Promise<boolean> => {
    try {
      setError(null);
      const api = await getCalendarApi();
      await api.deleteEvent(calendarId, eventId);
      
      // Refresh events after deleting
      await fetchEvents(calendarId);
      
      return true;
    } catch (error: any) {
      console.error('Error deleting event:', error);
      setError(error.message);
      throw error;
    }
  };

  const searchEvents = async (
    query: string, 
    calendarId: string = 'primary', 
    options: EventSearchOptions = {}
  ): Promise<CalendarEvent[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const api = await getCalendarApi();
      const response = await api.searchEvents(query, calendarId, options);
      
      return response.items || [];
    } catch (error: any) {
      console.error('Error searching events:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchCalendars();
      fetchEvents();
    }
  }, [isAuthenticated, accessToken]);

  const value: CalendarContextType = {
    calendars,
    events,
    isLoading,
    error,
    fetchCalendars,
    fetchEvents,
    createEvent,
    createEventWithMeet,
    updateEvent,
    deleteEvent,
    searchEvents,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
