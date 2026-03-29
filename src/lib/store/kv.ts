import { kv } from "@vercel/kv";
import { logger } from "../utils/logger";

// Conversation history
const CONVERSATION_PREFIX = "conversation:";
const MAX_HISTORY = 20; // 10 turns (user + assistant)

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export async function getConversationHistory(userId: string): Promise<ConversationMessage[]> {
  try {
    const history = await kv.get<ConversationMessage[]>(`${CONVERSATION_PREFIX}${userId}`);
    return history || [];
  } catch (err) {
    logger.warn("Failed to get conversation history, returning empty", { userId, error: String(err) });
    return [];
  }
}

export async function saveConversationHistory(
  userId: string,
  history: ConversationMessage[]
): Promise<void> {
  try {
    // Keep only the last MAX_HISTORY messages
    const trimmed = history.slice(-MAX_HISTORY);
    await kv.set(`${CONVERSATION_PREFIX}${userId}`, trimmed, { ex: 86400 }); // 24h TTL
  } catch (err) {
    logger.warn("Failed to save conversation history", { userId, error: String(err) });
  }
}

// Google OAuth tokens
interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

export async function getGoogleTokens(): Promise<GoogleTokens | null> {
  try {
    return await kv.get<GoogleTokens>("google:tokens");
  } catch {
    return null;
  }
}

export async function saveGoogleTokens(tokens: GoogleTokens): Promise<void> {
  await kv.set("google:tokens", tokens);
}

// Watermarks for notification deduplication
export async function getWatermark(service: string): Promise<number> {
  try {
    const val = await kv.get<number>(`watermark:${service}`);
    return val || 0;
  } catch {
    return 0;
  }
}

export async function setWatermark(service: string, timestamp: number): Promise<void> {
  await kv.set(`watermark:${service}`, timestamp);
}

// Reminders
interface Reminder {
  userId: string;
  message: string;
  triggerAt: number; // unix ms
}

export async function addReminder(reminder: Reminder): Promise<void> {
  try {
    const reminders = await kv.get<Reminder[]>("reminders") || [];
    reminders.push(reminder);
    await kv.set("reminders", reminders);
  } catch (err) {
    logger.error("Failed to add reminder", { error: String(err) });
  }
}

export async function getDueReminders(): Promise<Reminder[]> {
  try {
    const reminders = await kv.get<Reminder[]>("reminders") || [];
    const now = Date.now();
    const due = reminders.filter((r) => r.triggerAt <= now);
    const remaining = reminders.filter((r) => r.triggerAt > now);
    if (due.length > 0) {
      await kv.set("reminders", remaining);
    }
    return due;
  } catch {
    return [];
  }
}
