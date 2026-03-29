export interface ToolCallLog {
  name: string;
  input: unknown;
  output: unknown;
  duration_ms: number;
}

export interface GmailSearchInput {
  query: string;
  max_results?: number;
}

export interface GmailReadInput {
  message_id: string;
}

export interface GmailSendInput {
  to: string;
  subject: string;
  body: string;
  thread_id?: string;
}

export interface GmailDraftReplyInput {
  message_id: string;
  instructions?: string;
}

export interface CalendarListInput {
  date?: string;
  days?: number;
}

export interface CalendarCreateInput {
  title: string;
  start_time: string;
  end_time: string;
  description?: string;
  attendees?: string[];
  location?: string;
}

export interface CalendarFreeTimeInput {
  date: string;
  duration_minutes?: number;
}

export interface SlackPostInput {
  channel: string;
  text: string;
}

export interface SlackSearchInput {
  query: string;
  channel?: string;
}

export interface SlackMentionsInput {
  since_hours?: number;
}

export interface SlackSummarizeInput {
  channel: string;
  since_hours?: number;
}

export interface NotionCreatePageInput {
  title: string;
  content: string;
  database_id?: string;
}

export interface NotionSearchInput {
  query: string;
}

export interface NotionQueryDbInput {
  database_id: string;
  filter?: Record<string, unknown>;
}

export interface NotionUpdateTaskInput {
  page_id: string;
  status?: string;
  title?: string;
}

export interface NotionCreateAgendaInput {
  event_title: string;
  event_date: string;
  attendees?: string[];
}

export interface ReminderSetInput {
  message: string;
  delay_minutes: number;
}

export interface WeatherGetInput {
  city?: string;
}

export interface ImageAnalyzeInput {
  image_url: string;
  instruction?: string;
}

export type ToolInput =
  | GmailSearchInput
  | GmailReadInput
  | GmailSendInput
  | GmailDraftReplyInput
  | CalendarListInput
  | CalendarCreateInput
  | CalendarFreeTimeInput
  | SlackPostInput
  | SlackSearchInput
  | SlackMentionsInput
  | SlackSummarizeInput
  | NotionCreatePageInput
  | NotionSearchInput
  | NotionQueryDbInput
  | NotionUpdateTaskInput
  | NotionCreateAgendaInput
  | ReminderSetInput
  | WeatherGetInput
  | ImageAnalyzeInput;
