import { useEffect, useState, useCallback } from "react";
import * as Calendar from "expo-calendar";
import { useAuth } from "@/context/AuthContext";
import { CalendarEventSyncRequest, syncCalendarEvents } from "@/api/calendar";


export function useCalendar() {
  const { user, token } = useAuth();
  const [calendars, setCalendars] = useState<Calendar.Calendar[]>([]);
  const [writableCalendars, setWritableCalendars] = useState<Calendar.Calendar[]>([]);
  const [defaultCalendarId, setDefaultCalendarId] = useState<string | null>(null);
  const [events, setEvents] = useState<Calendar.Event[]>([]);

  const requestCalendarPermissions = async (): Promise<boolean> => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === "granted";
  };

  const getEvents = useCallback(async (): Promise<void> => {
    if (!defaultCalendarId) return;

    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(now.getMonth() + 1);

    const start = new Date(now.getTime() - 5 * 60 * 1000);
    const end = new Date(oneMonthLater.getTime() + 5 * 60 * 1000);

    try {
      const fetched = await Calendar.getEventsAsync([defaultCalendarId], start, end);

      // Filter events to only include those with title "[Zirkl Ai]"
      const zirklAiEvents = fetched.filter(event => event.title.startsWith("[Zirkl Ai]") || event.title.startsWith("Follow Up"));

      setEvents(zirklAiEvents);
    } catch (err) {
      console.error("Error fetching events", err);
    }
  }, [defaultCalendarId]);

  useEffect(() => {
    (async () => {
      const granted = await requestCalendarPermissions();
      if (!granted) return;

      const calendarList = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      setCalendars(calendarList);

      const writable = calendarList.filter((c) => c.allowsModifications);
      setWritableCalendars(writable);
      if (writable.length > 0) {
        setDefaultCalendarId(writable[0].id);
        await getEvents();
      }
    })();
  }, [user]);

  const createDeviceEvent = async (event: {
    title: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    notes?: string;
    reminders?: number[]; // Array of minutes before event to remind (e.g., [10, 30])
  }) => {
    if (!defaultCalendarId) throw new Error("No default calendar");

    const eventDetails = {
      title: event.title || "Untitled Event",
      startDate: event.startDate,
      endDate: event.endDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: event.location,
      notes: event.notes,
      alarms: event.reminders?.map(minutes => ({
        relativeOffset: -minutes, // Negative offset means minutes before the event
        method: Calendar.AlarmMethod.DEFAULT, // Use default reminder method (notification/sound)
      })) || [],
    };

    try {
      const id = await Calendar.createEventAsync(defaultCalendarId, eventDetails);
      await getEvents();
      return id;
    } catch (err: any) {
      throw new Error(err.message || "Error creating device event");
    }
  };

  const syncEventsToBackend = useCallback(async (eventsToSync: Calendar.Event[]): Promise<SyncEventsResponse> => {
    if (!token) {
      throw new Error("User not authenticated");
    }
    
    try {
      const eventsForBackend: CalendarEventSyncRequest = {
        device_events: eventsToSync.map(event => {
          return {
            title: event.title,
            startDate: event.startDate,
            endDate: event.endDate,
            timeZone: event.timeZone,
            location: event.location,
            notes: event.notes
          };
        })
      };

      const syncResult = await syncCalendarEvents(eventsForBackend, token);
      console.log(`Synced ${syncResult.synced_count} events`);
      
      return syncResult;
    } catch (error) {
      console.error('Error syncing events to backend:', error);
      throw error;
    }
  }, [token]);

  useEffect(() => {
    syncEventsToBackend(events);
    console.log("Events synced to backend");
  }, [events]);

  return {
    calendars,
    writableCalendars,
    defaultCalendarId,
    events,

    getEvents,
    createDeviceEvent,
  };
}
