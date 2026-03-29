export interface EmailSummary {
  id: string;
  thread_id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  is_unread: boolean;
}

export interface EmailDetail extends EmailSummary {
  body: string;
  to: string;
  cc?: string;
  attachments?: { filename: string; mime_type: string; size: number }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  attendees?: string[];
  meeting_url?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  duration_minutes: number;
}

export interface SlackMessage {
  channel: string;
  channel_name?: string;
  user: string;
  text: string;
  timestamp: string;
  permalink?: string;
}

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  last_edited: string;
  properties?: Record<string, unknown>;
}

export interface WeatherInfo {
  city: string;
  temp: number;
  temp_max: number;
  temp_min: number;
  description: string;
  humidity: number;
  icon: string;
}

export interface ServiceError {
  error: true;
  code: string;
  message: string;
}

export type ServiceResult<T> = T | ServiceError;

export function isServiceError(result: unknown): result is ServiceError {
  return typeof result === "object" && result !== null && "error" in result && (result as ServiceError).error === true;
}
