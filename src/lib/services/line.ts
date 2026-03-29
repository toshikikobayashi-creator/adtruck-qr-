import crypto from "crypto";
import { messagingApi, HTTPFetchError } from "@line/bot-sdk";
import { logger } from "../utils/logger";

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET || "",
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
};

function getClient() {
  return new messagingApi.MessagingApiClient({
    channelAccessToken: config.channelAccessToken,
  });
}

export function verifySignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("SHA256", config.channelSecret)
    .update(body)
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

export async function replyMessage(replyToken: string, text: string): Promise<void> {
  const client = getClient();
  // LINE has a 5000 char limit per message; split if needed
  const messages = splitText(text, 5000).map((t) => ({
    type: "text" as const,
    text: t,
  }));

  try {
    await client.replyMessage({ replyToken, messages });
    logger.info("LINE reply sent", { length: text.length });
  } catch (err) {
    if (err instanceof HTTPFetchError) {
      logger.error("LINE reply failed", { status: err.status, body: String(err.body) });
    }
    throw err;
  }
}

export async function pushMessage(userId: string, text: string): Promise<void> {
  const client = getClient();
  const messages = splitText(text, 5000).map((t) => ({
    type: "text" as const,
    text: t,
  }));

  try {
    await client.pushMessage({ to: userId, messages });
    logger.info("LINE push sent", { userId, length: text.length });
  } catch (err) {
    if (err instanceof HTTPFetchError) {
      logger.error("LINE push failed", { status: err.status, body: String(err.body) });
    }
    throw err;
  }
}

function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, maxLen));
    remaining = remaining.slice(maxLen);
  }
  return chunks;
}
