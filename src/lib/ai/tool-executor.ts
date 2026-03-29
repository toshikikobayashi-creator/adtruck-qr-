import * as gmail from "../services/gmail";
import * as calendar from "../services/calendar";
import * as slack from "../services/slack";
import * as notion from "../services/notion";
import * as weather from "../services/weather";
import { addReminder } from "../store/kv";
import { logger } from "../utils/logger";
import type {
  GmailSearchInput, GmailReadInput, GmailSendInput, GmailDraftReplyInput,
  CalendarListInput, CalendarCreateInput, CalendarFreeTimeInput,
  SlackPostInput, SlackSearchInput, SlackMentionsInput, SlackSummarizeInput,
  NotionCreatePageInput, NotionSearchInput, NotionQueryDbInput, NotionUpdateTaskInput,
  NotionCreateAgendaInput,
  ReminderSetInput, WeatherGetInput, ImageAnalyzeInput,
} from "../../types/tools";

type ToolHandler = (input: unknown) => Promise<unknown>;

const handlers: Record<string, ToolHandler> = {
  // Gmail
  gmail_search: async (input) => {
    const { query, max_results } = input as GmailSearchInput;
    return gmail.search(query, max_results);
  },
  gmail_read: async (input) => {
    const { message_id } = input as GmailReadInput;
    return gmail.read(message_id);
  },
  gmail_send: async (input) => {
    const { to, subject, body, thread_id } = input as GmailSendInput;
    return gmail.send(to, subject, body, thread_id);
  },
  gmail_draft_reply: async (input) => {
    const { message_id } = input as GmailDraftReplyInput;
    // Read the original email first, then create draft
    const original = await gmail.read(message_id);
    if ("error" in original && original.error) return original;
    return gmail.draftReply(message_id, `(AI generated draft based on original email)`);
  },

  // Calendar
  calendar_list_events: async (input) => {
    const { date, days } = input as CalendarListInput;
    return calendar.listEvents(date, days);
  },
  calendar_create_event: async (input) => {
    return calendar.createEvent(input as CalendarCreateInput);
  },
  calendar_find_free_time: async (input) => {
    const { date, duration_minutes } = input as CalendarFreeTimeInput;
    return calendar.findFreeTime(date, duration_minutes);
  },

  // Slack
  slack_post_message: async (input) => {
    const { channel, text } = input as SlackPostInput;
    return slack.postMessage(channel, text);
  },
  slack_search: async (input) => {
    const { query, channel } = input as SlackSearchInput;
    return slack.searchMessages(query, channel);
  },
  slack_get_mentions: async (input) => {
    const { since_hours } = input as SlackMentionsInput;
    return slack.getMentions(since_hours);
  },
  slack_summarize_channel: async (input) => {
    const { channel, since_hours } = input as SlackSummarizeInput;
    return slack.summarizeChannel(channel, since_hours);
  },

  // Notion
  notion_create_page: async (input) => {
    const { title, content, database_id } = input as NotionCreatePageInput;
    return notion.createPage(title, content, database_id);
  },
  notion_search: async (input) => {
    const { query } = input as NotionSearchInput;
    return notion.search(query);
  },
  notion_query_database: async (input) => {
    const { database_id, filter } = input as NotionQueryDbInput;
    return notion.queryDatabase(database_id, filter);
  },
  notion_update_task: async (input) => {
    const { page_id, status, title } = input as NotionUpdateTaskInput;
    return notion.updateTask(page_id, { status, title });
  },
  notion_create_agenda: async (input) => {
    const { event_title, event_date, attendees } = input as NotionCreateAgendaInput;
    return notion.createAgenda(event_title, event_date, attendees);
  },

  // Utility
  set_reminder: async (input) => {
    const { message, delay_minutes } = input as ReminderSetInput;
    const userId = process.env.LINE_USER_ID || "";
    await addReminder({
      userId,
      message,
      triggerAt: Date.now() + delay_minutes * 60 * 1000,
    });
    return { success: true, message: `${delay_minutes}分後にリマインドします: ${message}` };
  },
  get_weather: async (input) => {
    const { city } = input as WeatherGetInput;
    return weather.getWeather(city);
  },
  analyze_image: async (input) => {
    const { image_url, instruction } = input as ImageAnalyzeInput;
    // Image analysis is handled by Claude itself via multimodal input
    // This tool returns the URL so Claude can process it
    return {
      image_url,
      instruction: instruction || "この画像の内容を説明してください",
      note: "Image will be analyzed by Claude multimodal capabilities",
    };
  },
};

export async function executeTool(
  name: string,
  input: unknown
): Promise<{ result: unknown; duration_ms: number }> {
  const handler = handlers[name];
  if (!handler) {
    return {
      result: { error: true, code: "UNKNOWN_TOOL", message: `Unknown tool: ${name}` },
      duration_ms: 0,
    };
  }

  const start = Date.now();
  try {
    const result = await handler(input);
    const duration_ms = Date.now() - start;
    logger.info("Tool executed", { name, duration_ms });
    return { result, duration_ms };
  } catch (err) {
    const duration_ms = Date.now() - start;
    logger.error("Tool execution failed", { name, error: String(err), duration_ms });
    return {
      result: { error: true, code: "TOOL_EXECUTION_FAILED", message: String(err) },
      duration_ms,
    };
  }
}
