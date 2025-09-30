import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Calendar from "expo-calendar";
import * as AuthSession from "expo-auth-session";
import { useAuth } from "@/context/AuthContext";


export function useCalendar() {
  const { user } = useAuth();
  const [calendars, setCalendars] = useState<Calendar.Calendar[]>([]);
  const [writableCalendars, setWritableCalendars] = useState<Calendar.Calendar[]>([]);
  const [defaultCalendarId, setDefaultCalendarId] = useState<string | null>(null);
  const [events, setEvents] = useState<Calendar.Event[]>([]);

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

  const requestCalendarPermissions = async (): Promise<boolean> => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === "granted";
  };

  const getEvents = async (): Promise<void> => {
    if (!defaultCalendarId) return;

    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(now.getMonth() + 1);

    const start = new Date(now.getTime() - 5 * 60 * 1000);
    const end = new Date(oneMonthLater.getTime() + 5 * 60 * 1000);

    try {
      const fetched = await Calendar.getEventsAsync([defaultCalendarId], start, end);
      setEvents(fetched);
    } catch (err) {
      console.error("Error fetching events", err);
    }
  };

  const createDeviceEvent = async (event: {
    title: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    notes?: string;
  }) => {
    if (!defaultCalendarId) throw new Error("No default calendar");

    const eventDetails = {
      title: event.title || "Untitled Event",
      startDate: event.startDate,
      endDate: event.endDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: event.location,
      notes: event.notes,
    };

    try {
      const id = await Calendar.createEventAsync(defaultCalendarId, eventDetails);
      await getEvents();
      return id;
    } catch (err: any) {
      throw new Error(err.message || "Error creating device event");
    }
  };

  return {
    calendars,
    writableCalendars,
    defaultCalendarId,
    events,

    getEvents,
    createDeviceEvent,
  };
}
