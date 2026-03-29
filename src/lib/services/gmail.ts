import { google } from "googleapis";
import { getAuthenticatedClient } from "../auth/google-oauth";
import { logger } from "../utils/logger";
import type { EmailSummary, EmailDetail, ServiceResult } from "../../types/services";

async function getGmailClient() {
  const auth = await getAuthenticatedClient();
  return google.gmail({ version: "v1", auth });
}

export async function search(query: string, maxResults: number = 5): Promise<ServiceResult<EmailSummary[]>> {
  try {
    const gmail = await getGmailClient();
    const res = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults,
    });

    if (!res.data.messages || res.data.messages.length === 0) {
      return [];
    }

    const emails: EmailSummary[] = await Promise.all(
      res.data.messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "metadata",
          metadataHeaders: ["From", "Subject", "Date"],
        });

        const headers = detail.data.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

        return {
          id: msg.id!,
          thread_id: msg.threadId!,
          from: getHeader("From"),
          subject: getHeader("Subject"),
          snippet: detail.data.snippet || "",
          date: getHeader("Date"),
          is_unread: (detail.data.labelIds || []).includes("UNREAD"),
        };
      })
    );

    return emails;
  } catch (err) {
    logger.error("Gmail search failed", { query, error: String(err) });
    return { error: true, code: "GMAIL_SEARCH_FAILED", message: String(err) };
  }
}

export async function read(messageId: string): Promise<ServiceResult<EmailDetail>> {
  try {
    const gmail = await getGmailClient();
    const res = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const headers = res.data.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

    const body = extractBody(res.data.payload);
    const attachments = (res.data.payload?.parts || [])
      .filter((p) => p.filename && p.filename.length > 0)
      .map((p) => ({
        filename: p.filename!,
        mime_type: p.mimeType || "application/octet-stream",
        size: p.body?.size || 0,
      }));

    return {
      id: messageId,
      thread_id: res.data.threadId!,
      from: getHeader("From"),
      to: getHeader("To"),
      cc: getHeader("Cc") || undefined,
      subject: getHeader("Subject"),
      snippet: res.data.snippet || "",
      date: getHeader("Date"),
      is_unread: (res.data.labelIds || []).includes("UNREAD"),
      body,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
  } catch (err) {
    logger.error("Gmail read failed", { messageId, error: String(err) });
    return { error: true, code: "GMAIL_READ_FAILED", message: String(err) };
  }
}

export async function send(
  to: string,
  subject: string,
  body: string,
  threadId?: string
): Promise<ServiceResult<{ messageId: string }>> {
  try {
    const gmail = await getGmailClient();

    const messageParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
    ];
    const raw = Buffer.from(messageParts.join("\r\n")).toString("base64url");

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
        threadId: threadId || undefined,
      },
    });

    logger.info("Gmail send success", { to, subject, messageId: res.data.id });
    return { messageId: res.data.id! };
  } catch (err) {
    logger.error("Gmail send failed", { to, subject, error: String(err) });
    return { error: true, code: "GMAIL_SEND_FAILED", message: String(err) };
  }
}

export async function draftReply(
  messageId: string,
  replyBody: string
): Promise<ServiceResult<{ draftId: string }>> {
  try {
    const gmail = await getGmailClient();

    // Get original message for reply headers
    const original = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Message-ID"],
    });

    const headers = original.data.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

    const from = getHeader("From");
    const subject = getHeader("Subject").startsWith("Re:") ? getHeader("Subject") : `Re: ${getHeader("Subject")}`;
    const messageIdHeader = getHeader("Message-ID");

    const messageParts = [
      `To: ${from}`,
      `Subject: ${subject}`,
      `In-Reply-To: ${messageIdHeader}`,
      `References: ${messageIdHeader}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      replyBody,
    ];
    const raw = Buffer.from(messageParts.join("\r\n")).toString("base64url");

    const res = await gmail.users.drafts.create({
      userId: "me",
      requestBody: {
        message: {
          raw,
          threadId: original.data.threadId!,
        },
      },
    });

    logger.info("Gmail draft created", { draftId: res.data.id });
    return { draftId: res.data.id! };
  } catch (err) {
    logger.error("Gmail draft failed", { messageId, error: String(err) });
    return { error: true, code: "GMAIL_DRAFT_FAILED", message: String(err) };
  }
}

function extractBody(payload: { mimeType?: string | null; body?: { data?: string | null } | null; parts?: Array<{ mimeType?: string | null; body?: { data?: string | null } | null; parts?: unknown[] | null }> | null } | undefined | null): string {
  if (!payload) return "";

  // Simple text/plain body
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }

  // Multipart: look for text/plain in parts
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64url").toString("utf-8");
      }
    }
    // Fallback: look for text/html
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        const html = Buffer.from(part.body.data, "base64url").toString("utf-8");
        return html.replace(/<[^>]*>/g, "").trim();
      }
    }
  }

  return "";
}
