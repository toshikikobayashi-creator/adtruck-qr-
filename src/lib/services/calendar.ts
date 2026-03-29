import { google } from "googleapis";
import { getAuthenticatedClient } from "../auth/google-oauth";
import { logger } from "../utils/logger";
import { startOfDayJST, endOfDayJST, formatJST } from "../utils/date";
import type { CalendarEvent, TimeSlot, ServiceResult } from "../../types/services";

async function getCalendarClient() {
  const auth = await getAuthenticatedClient();
  return google.calendar({ version: "v3", auth });
}

export async function listEvents(
  date?: string,
  days: number = 1
): Promise<ServiceResult<CalendarEvent[]>> {
  try {
    const calendar = await getCalendarClient();
    const timeMin = startOfDayJST(date);

    // Calculate end date
    const startDate = date || new Date().toISOString().slice(0, 10);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    const timeMax = endOfDayJST(endDate.toISOString().slice(0, 10));

    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 50,
    });

    const events: CalendarEvent[] = (res.data.items || []).map((item) => ({
      id: item.id!,
      title: item.summary || "(無題)",
      start: item.start?.dateTime || item.start?.date || "",
      end: item.end?.dateTime || item.end?.date || "",
      description: item.description || undefined,
      location: item.location || undefined,
      attendees: item.attendees?.map((a) => a.email || "").filter(Boolean) || undefined,
      meeting_url: extractMeetingUrl(item),
    }));

    return events;
  } catch (err) {
    logger.error("Calendar listEvents failed", { error: String(err) });
    return { error: true, code: "CALENDAR_LIST_FAILED", message: String(err) };
  }
}

export async function createEvent(params: {
  title: string;
  start_time: string;
  end_time: string;
  description?: string;
  attendees?: string[];
  location?: string;
}): Promise<ServiceResult<CalendarEvent>> {
  try {
    const calendar = await getCalendarClient();

    const event = {
      summary: params.title,
      description: params.description,
      location: params.location,
      start: { dateTime: params.start_time, timeZone: "Asia/Tokyo" },
      end: { dateTime: params.end_time, timeZone: "Asia/Tokyo" },
      attendees: params.attendees?.map((email) => ({ email })),
    };

    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      sendUpdates: params.attendees ? "all" : "none",
    });

    logger.info("Calendar event created", { id: res.data.id, title: params.title });

    return {
      id: res.data.id!,
      title: res.data.summary || params.title,
      start: res.data.start?.dateTime || params.start_time,
      end: res.data.end?.dateTime || params.end_time,
      description: res.data.description || undefined,
      location: res.data.location || undefined,
      attendees: res.data.attendees?.map((a) => a.email || "").filter(Boolean),
      meeting_url: extractMeetingUrl(res.data),
    };
  } catch (err) {
    logger.error("Calendar createEvent failed", { error: String(err) });
    return { error: true, code: "CALENDAR_CREATE_FAILED", message: String(err) };
  }
}

export async function findFreeTime(
  date: string,
  durationMinutes: number = 60
): Promise<ServiceResult<TimeSlot[]>> {
  try {
    const events = await listEvents(date, 1);
    if ("error" in events && events.error) return events;

    const dayStart = new Date(`${date}T09:00:00+09:00`);
    const dayEnd = new Date(`${date}T18:00:00+09:00`);

    const busySlots = (events as CalendarEvent[])
      .filter((e) => e.start.includes("T")) // skip all-day events
      .map((e) => ({
        start: new Date(e.start).getTime(),
        end: new Date(e.end).getTime(),
      }))
      .sort((a, b) => a.start - b.start);

    const freeSlots: TimeSlot[] = [];
    let cursor = dayStart.getTime();

    for (const busy of busySlots) {
      if (busy.start > cursor) {
        const gap = (busy.start - cursor) / (1000 * 60);
        if (gap >= durationMinutes) {
          freeSlots.push({
            start: formatJST(new Date(cursor), "HH:mm"),
            end: formatJST(new Date(busy.start), "HH:mm"),
            duration_minutes: gap,
          });
        }
      }
      cursor = Math.max(cursor, busy.end);
    }

    // Check remaining time after last event
    if (cursor < dayEnd.getTime()) {
      const gap = (dayEnd.getTime() - cursor) / (1000 * 60);
      if (gap >= durationMinutes) {
        freeSlots.push({
          start: formatJST(new Date(cursor), "HH:mm"),
          end: formatJST(dayEnd, "HH:mm"),
          duration_minutes: gap,
        });
      }
    }

    return freeSlots;
  } catch (err) {
    logger.error("Calendar findFreeTime failed", { error: String(err) });
    return { error: true, code: "CALENDAR_FREETIME_FAILED", message: String(err) };
  }
}

export async function getUpcomingEvents(withinMinutes: number = 15): Promise<CalendarEvent[]> {
  const now = new Date();
  const soon = new Date(now.getTime() + withinMinutes * 60 * 1000);

  try {
    const calendar = await getCalendarClient();
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: soon.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return (res.data.items || []).map((item) => ({
      id: item.id!,
      title: item.summary || "(無題)",
      start: item.start?.dateTime || item.start?.date || "",
      end: item.end?.dateTime || item.end?.date || "",
      description: item.description || undefined,
      location: item.location || undefined,
      attendees: item.attendees?.map((a) => a.email || "").filter(Boolean),
      meeting_url: extractMeetingUrl(item),
    }));
  } catch {
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMeetingUrl(item: any): string | undefined {
  // Google Meet
  if (item.hangoutLink) return item.hangoutLink;
  // Zoom or other meeting links in description/location
  const text = `${item.description || ""} ${item.location || ""}`;
  const zoomMatch = text.match(/https:\/\/[\w.-]*zoom\.us\/j\/\S+/);
  if (zoomMatch) return zoomMatch[0];
  const meetMatch = text.match(/https:\/\/meet\.google\.com\/\S+/);
  if (meetMatch) return meetMatch[0];
  return undefined;
}
