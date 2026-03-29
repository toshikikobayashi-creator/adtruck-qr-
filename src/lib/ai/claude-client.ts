import Anthropic from "@anthropic-ai/sdk";
import { allTools } from "./tools";
import { executeTool } from "./tool-executor";
import { logger } from "../utils/logger";
import { nowJST, formatJST } from "../utils/date";
import type { ToolCallLog } from "../../types/tools";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `あなたはLINEを通じてユーザーをサポートするAI秘書アシスタントです。
名前は「AI秘書」です。

## できること
- Gmail: メールの検索、閲覧、送信、返信ドラフトの自動生成
- Googleカレンダー: 予定の確認、作成、空き時間の検索
- Slack: メッセージの投稿、検索、メンション確認、チャンネル要約
- Notion: ページ/メモの作成、検索、タスク管理、会議アジェンダ生成
- リマインダー: 指定時間後にLINEで通知
- 天気予報: 指定都市の天気を取得
- 画像解析: 送られた画像の内容を分析

## 重要なルール
1. **確認フロー**: メール送信、Slack投稿、カレンダー作成など副作用のある操作は、実行前に必ず内容を提示してユーザーに確認を求めてください。
2. **言語**: ユーザーと同じ言語で応答してください（基本は日本語）。
3. **簡潔さ**: 回答は簡潔で分かりやすく。長文は箇条書きを使用。
4. **タイムゾーン**: 全ての日時はJST（日本標準時）で処理。
5. **エラー対応**: ツールがエラーを返した場合、ユーザーに分かりやすく説明してください。
6. **プライバシー**: メールの全文やパスワードなどの機密情報は要約して提示し、原文をそのまま表示しないでください。

## 現在時刻
{current_time}
`;

interface ProcessResult {
  response: string;
  toolCalls: ToolCallLog[];
}

export async function processMessage(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  imageUrl?: string
): Promise<ProcessResult> {
  const toolCalls: ToolCallLog[] = [];

  const systemPrompt = SYSTEM_PROMPT.replace(
    "{current_time}",
    formatJST(nowJST(), "yyyy年M月d日(E) HH:mm") + " JST"
  );

  // Build messages
  const messages: Anthropic.MessageParam[] = conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // Add current user message
  if (imageUrl) {
    messages.push({
      role: "user",
      content: [
        { type: "image", source: { type: "url", url: imageUrl } },
        { type: "text", text: userMessage || "この画像について教えてください" },
      ],
    });
  } else {
    messages.push({ role: "user", content: userMessage });
  }

  const MAX_ITERATIONS = 10;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        tools: allTools,
        messages,
      });

      // Check if we're done (text response with no tool use)
      if (response.stop_reason === "end_turn") {
        const textContent = response.content.find((c) => c.type === "text");
        return {
          response: textContent ? textContent.text : "（応答を生成できませんでした）",
          toolCalls,
        };
      }

      // Handle tool use
      if (response.stop_reason === "tool_use") {
        // Add assistant message to conversation
        messages.push({ role: "assistant", content: response.content });

        // Execute all tool calls
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of response.content) {
          if (block.type === "tool_use") {
            logger.info("Executing tool", { name: block.name, input: block.input });
            const { result, duration_ms } = await executeTool(block.name, block.input);
            toolCalls.push({
              name: block.name,
              input: block.input,
              output: result,
              duration_ms,
            });
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          }
        }

        // Add tool results to messages
        messages.push({ role: "user", content: toolResults });
        continue;
      }

      // Unexpected stop reason
      const textContent = response.content.find((c) => c.type === "text");
      return {
        response: textContent ? textContent.text : "（予期しない応答です）",
        toolCalls,
      };
    } catch (err) {
      logger.error("Claude API error", { error: String(err), iteration: iterations });

      if (iterations < 3 && String(err).includes("rate_limit")) {
        await new Promise((r) => setTimeout(r, 2000 * iterations));
        continue;
      }

      return {
        response: "申し訳ありません、AI処理中にエラーが発生しました。しばらく待ってからもう一度お試しください。",
        toolCalls,
      };
    }
  }

  return {
    response: "処理が複雑すぎて完了できませんでした。もう少し具体的にお伝えいただけますか？",
    toolCalls,
  };
}

/**
 * Generate a summary of given data (used by cron jobs)
 */
export async function generateSummary(data: {
  events?: unknown;
  emails?: unknown;
  slackMentions?: unknown;
  weather?: unknown;
  type: "daily" | "weekly";
}): Promise<string> {
  const prompts = {
    daily: `以下のデータを基に、簡潔な朝のブリーフィングを日本語で作成してください。
絵文字を適度に使い、読みやすくフォーマットしてください。

【今日の予定】
${JSON.stringify(data.events, null, 2)}

【未読メール】
${JSON.stringify(data.emails, null, 2)}

【Slackメンション】
${JSON.stringify(data.slackMentions, null, 2)}

【天気】
${JSON.stringify(data.weather, null, 2)}`,

    weekly: `以下の1週間のデータを基に、週次レポートを日本語で作成してください。
統計情報、主要なハイライト、来週への引き継ぎ事項をまとめてください。

${JSON.stringify(data, null, 2)}`,
  };

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompts[data.type] }],
    });

    const text = response.content.find((c) => c.type === "text");
    return text ? text.text : "サマリーを生成できませんでした。";
  } catch (err) {
    logger.error("Summary generation failed", { error: String(err) });
    return "サマリーの生成中にエラーが発生しました。";
  }
}
