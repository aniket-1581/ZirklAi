import { useEffect, useState, useCallback } from "react";
import * as Calendar from "expo-calendar";
import { useAuth } from "@/context/AuthContext";


export function useCalendar() {
  const { user } = useAuth();
  const [calendars, setCalendars] = useState<Calendar.Calendar[]>([]);
  const [writableCalendars, setWritableCalendars] = useState<Calendar.Calendar[]>([]);
  const [defaultCalendarId, setDefaultCalendarId] = useState<string | null>(null);

  const requestCalendarPermissions = async (): Promise<boolean> => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === "granted";
  };

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
    console.log(event.startDate, event.endDate)
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
      return id;
    } catch (err: any) {
      throw new Error(err.message || "Error creating device event");
    }
  };

  return {
    calendars,
    writableCalendars,

    createDeviceEvent,
  };
}
