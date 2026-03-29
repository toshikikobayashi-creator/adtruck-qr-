import { NextRequest, NextResponse } from "next/server";
import { verifySignature, replyMessage } from "@/lib/services/line";
import { processMessage } from "@/lib/ai/claude-client";
import { getConversationHistory, saveConversationHistory } from "@/lib/store/kv";
import { logger } from "@/lib/utils/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-line-signature");

    if (!signature || !verifySignature(body, signature)) {
      logger.warn("Invalid LINE signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const events = payload.events || [];

    for (const event of events) {
      if (event.type === "message") {
        await handleMessageEvent(event);
      }
    }

    // Always return 200 to LINE to prevent retries
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    logger.error("LINE webhook error", { error: String(err) });
    return NextResponse.json({ status: "ok" });
  }
}

async function handleMessageEvent(event: {
  replyToken: string;
  source: { userId?: string };
  message: { type: string; text?: string; id?: string; contentProvider?: { originalContentUrl?: string } };
}) {
  const userId = event.source.userId;
  if (!userId) return;

  let userMessage = "";
  let imageUrl: string | undefined;

  switch (event.message.type) {
    case "text":
      userMessage = event.message.text || "";
      break;
    case "image":
      // For image messages, we get the content URL
      imageUrl = `https://api-data.line.me/v2/bot/message/${event.message.id}/content`;
      userMessage = "この画像について教えてください";
      break;
    case "file":
      userMessage = "ファイルが送信されました。テキストメッセージでお話しかけてください。";
      await replyMessage(event.replyToken, userMessage);
      return;
    default:
      userMessage = "このメッセージ形式には対応していません。テキストでお話しかけてください。";
      await replyMessage(event.replyToken, userMessage);
      return;
  }

  try {
    // Load conversation history
    const history = await getConversationHistory(userId);

    // Process with Claude
    const { response, toolCalls } = await processMessage(userMessage, history, imageUrl);

    logger.info("Message processed", {
      userId,
      toolCallCount: toolCalls.length,
      tools: toolCalls.map((t) => t.name),
    });

    // Save updated conversation history
    await saveConversationHistory(userId, [
      ...history,
      { role: "user", content: userMessage },
      { role: "assistant", content: response },
    ]);

    // Reply to LINE
    await replyMessage(event.replyToken, response);
  } catch (err) {
    logger.error("Message processing failed", { userId, error: String(err) });
    await replyMessage(
      event.replyToken,
      "申し訳ありません、処理中にエラーが発生しました。しばらく待ってからもう一度お試しください。"
    );
  }
}
