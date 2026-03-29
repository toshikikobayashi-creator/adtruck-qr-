import { WebClient } from "@slack/web-api";
import { logger } from "../utils/logger";
import type { SlackMessage, ServiceResult } from "../../types/services";

function getClient() {
  return new WebClient(process.env.SLACK_BOT_TOKEN);
}

// Channel name → ID cache
const channelCache = new Map<string, string>();

async function resolveChannel(nameOrId: string): Promise<string> {
  // Already an ID
  if (nameOrId.startsWith("C") && nameOrId.length > 8) return nameOrId;

  const name = nameOrId.replace(/^#/, "");
  if (channelCache.has(name)) return channelCache.get(name)!;

  const client = getClient();
  let cursor: string | undefined;
  do {
    const res = await client.conversations.list({ limit: 200, cursor });
    for (const ch of res.channels || []) {
      if (ch.name === name && ch.id) {
        channelCache.set(name, ch.id);
        return ch.id;
      }
    }
    cursor = res.response_metadata?.next_cursor || undefined;
  } while (cursor);

  throw new Error(`Channel not found: ${nameOrId}`);
}

export async function postMessage(
  channel: string,
  text: string
): Promise<ServiceResult<{ channel: string; ts: string }>> {
  try {
    const client = getClient();
    const channelId = await resolveChannel(channel);
    const res = await client.chat.postMessage({ channel: channelId, text });
    logger.info("Slack message posted", { channel, ts: res.ts });
    return { channel: channelId, ts: res.ts! };
  } catch (err) {
    logger.error("Slack postMessage failed", { channel, error: String(err) });
    return { error: true, code: "SLACK_POST_FAILED", message: String(err) };
  }
}

export async function searchMessages(
  query: string,
  channel?: string
): Promise<ServiceResult<SlackMessage[]>> {
  try {
    const client = getClient();
    const fullQuery = channel ? `${query} in:#${channel.replace(/^#/, "")}` : query;
    const res = await client.search.messages({ query: fullQuery, count: 10, sort: "timestamp", sort_dir: "desc" });

    const messages: SlackMessage[] = (res.messages?.matches || []).map((m) => ({
      channel: m.channel?.id || "",
      channel_name: m.channel?.name || undefined,
      user: m.username || m.user || "",
      text: m.text || "",
      timestamp: m.ts || "",
      permalink: m.permalink || undefined,
    }));

    return messages;
  } catch (err) {
    logger.error("Slack search failed", { query, error: String(err) });
    return { error: true, code: "SLACK_SEARCH_FAILED", message: String(err) };
  }
}

export async function getMentions(sinceHours: number = 24): Promise<ServiceResult<SlackMessage[]>> {
  try {
    const client = getClient();
    // Get bot's own user ID
    const authRes = await client.auth.test();
    const botUserId = authRes.user_id;

    // Search for mentions
    const since = Math.floor(Date.now() / 1000) - sinceHours * 3600;
    const res = await client.search.messages({
      query: `<@${botUserId}>`,
      count: 20,
      sort: "timestamp",
      sort_dir: "desc",
    });

    const messages: SlackMessage[] = (res.messages?.matches || [])
      .filter((m) => parseFloat(m.ts || "0") >= since)
      .map((m) => ({
        channel: m.channel?.id || "",
        channel_name: m.channel?.name || undefined,
        user: m.username || m.user || "",
        text: m.text || "",
        timestamp: m.ts || "",
        permalink: m.permalink || undefined,
      }));

    return messages;
  } catch (err) {
    logger.error("Slack getMentions failed", { error: String(err) });
    return { error: true, code: "SLACK_MENTIONS_FAILED", message: String(err) };
  }
}

export async function summarizeChannel(
  channel: string,
  sinceHours: number = 24
): Promise<ServiceResult<SlackMessage[]>> {
  try {
    const client = getClient();
    const channelId = await resolveChannel(channel);
    const oldest = String(Math.floor(Date.now() / 1000) - sinceHours * 3600);

    const res = await client.conversations.history({
      channel: channelId,
      oldest,
      limit: 100,
    });

    const messages: SlackMessage[] = (res.messages || [])
      .reverse() // chronological order
      .map((m) => ({
        channel: channelId,
        user: m.user || "",
        text: m.text || "",
        timestamp: m.ts || "",
      }));

    return messages;
  } catch (err) {
    logger.error("Slack summarizeChannel failed", { channel, error: String(err) });
    return { error: true, code: "SLACK_SUMMARIZE_FAILED", message: String(err) };
  }
}
