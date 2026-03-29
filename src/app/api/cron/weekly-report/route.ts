import { NextRequest, NextResponse } from "next/server";
import { pushMessage } from "@/lib/services/line";
import { search as gmailSearch } from "@/lib/services/gmail";
import { listEvents } from "@/lib/services/calendar";
import { getMentions } from "@/lib/services/slack";
import { generateSummary } from "@/lib/ai/claude-client";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = process.env.LINE_USER_ID;
  if (!userId) {
    return NextResponse.json({ error: "LINE_USER_ID not configured" }, { status: 500 });
  }

  try {
    // Get this week's data
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().slice(0, 10);

    const [events, emails, slackMentions] = await Promise.allSettled([
      listEvents(weekAgoStr, 7),
      gmailSearch(`after:${weekAgoStr}`, 50),
      getMentions(168), // 7 days in hours
    ]);

    const summary = await generateSummary({
      type: "weekly",
      events: events.status === "fulfilled" ? events.value : null,
      emails: emails.status === "fulfilled" ? emails.value : null,
      slackMentions: slackMentions.status === "fulfilled" ? slackMentions.value : null,
    });

    await pushMessage(userId, `📊 週次レポート\n\n${summary}`);

    logger.info("Weekly report sent");
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    logger.error("Weekly report failed", { error: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
